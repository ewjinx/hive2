import os
import sys
import threading
import time
import requests
import customtkinter as ctk
import pystray
from PIL import Image, ImageDraw
from tkinter import messagebox

import config
from main import manager
import psutil

ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")

class HiveApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("Hive Node Manager")
        self.geometry("400x600")
        self.resizable(False, False)
        
        # Handle close button -> minimize to tray
        self.protocol("WM_DELETE_WINDOW", self.hide_window)
        
        self.tray_icon = None
        self.tray_thread = None
        self.icon_state = "offline"
        
        self.frames = {}
        self.build_ui()
        
        if not config.TOKEN:
            self.show_frame("login")
        else:
            self.show_frame("dashboard")
            manager.start()
            
        self.setup_tray()
        self.update_loop()

    def build_ui(self):
        self.grid_rowconfigure(0, weight=1)
        self.grid_columnconfigure(0, weight=1)
        
        # --- LOGIN FRAME ---
        login_frame = ctk.CTkFrame(self, fg_color="transparent")
        login_frame.grid(row=0, column=0, sticky="nsew", padx=40, pady=80)
        
        ctk.CTkLabel(login_frame, text="Hive", font=ctk.CTkFont(size=32, weight="bold")).pack(pady=(0, 20))
        
        self.email_entry = ctk.CTkEntry(login_frame, placeholder_text="Email", width=250)
        self.email_entry.pack(pady=10)
        
        self.password_entry = ctk.CTkEntry(login_frame, placeholder_text="Password", show="*", width=250)
        self.password_entry.pack(pady=10)
        
        self.login_btn = ctk.CTkButton(login_frame, text="Log In", command=self.do_login, width=250)
        self.login_btn.pack(pady=20)
        
        self.login_error_label = ctk.CTkLabel(login_frame, text="", text_color="red")
        self.login_error_label.pack()
        
        self.frames["login"] = login_frame
        
        # --- DASHBOARD FRAME ---
        dash_frame = ctk.CTkFrame(self, fg_color="transparent")
        dash_frame.grid(row=0, column=0, sticky="nsew", padx=10, pady=10)
        
        header = ctk.CTkFrame(dash_frame, fg_color="transparent")
        header.pack(fill="x", pady=10)
        
        ctk.CTkLabel(header, text="Your Nodes", font=ctk.CTkFont(size=20, weight="bold")).pack(side="left")
        
        btns = ctk.CTkFrame(header, fg_color="transparent")
        btns.pack(side="right")
        
        ctk.CTkButton(btns, text="Logout", width=60, command=self.do_logout, fg_color="#F44336", hover_color="#D32F2F").pack(side="right", padx=5)
        ctk.CTkButton(btns, text="+ Add Node", width=80, command=self.add_node).pack(side="right")
        
        self.scroll_frame = ctk.CTkScrollableFrame(dash_frame)
        self.scroll_frame.pack(fill="both", expand=True, pady=10)
        
        self.frames["dashboard"] = dash_frame

    def show_frame(self, name):
        for f in self.frames.values():
            f.grid_remove()
        self.frames[name].grid()
        if name == "dashboard" and config.TOKEN:
            self.refresh_nodes()

    def do_login(self):
        email = self.email_entry.get().strip()
        pwd = self.password_entry.get().strip()
        
        self.login_btn.configure(state="disabled", text="Connecting...")
        self.update()
        
        try:
            r = requests.post(f"{config.API_URL}/login/access-token", data={"username": email, "password": pwd})
            if r.status_code == 200:
                token = r.json().get("access_token")
                config.save_config(token=token)
                
                # Fetch agents assigned to this user securely
                fetch_r = requests.get(f"{config.API_URL}/agents", headers={"Authorization": f"Bearer {token}"})
                if fetch_r.status_code == 200:
                    config.save_config(agents=fetch_r.json())
                
                self.login_error_label.configure(text="")
                manager.start()
                self.show_frame("dashboard")
            else:
                self.login_error_label.configure(text="Invalid credentials.")
        except Exception as e:
            self.login_error_label.configure(text=f"Connection error: {e}")
            
        self.login_btn.configure(state="normal", text="Log In")

    def do_logout(self):
        manager.stop()
        config.save_config(token="", agents=[])
        self.email_entry.delete(0, 'end')
        self.password_entry.delete(0, 'end')
        self.show_frame("login")

    def add_node(self):
        headers = {"Authorization": f"Bearer {config.TOKEN}"}
        max_cpu = psutil.cpu_count()
        max_ram = round(psutil.virtual_memory().total / (1024**3), 1)
        
        payload = {
            "name": f"Node-{len(config.AGENTS)+1}",
            "cpu_cores": max(1, max_cpu - 1),
            "ram_gb": max(1.0, max_ram / 2),
            "status": "idle"
        }
        
        try:
            r = requests.post(f"{config.API_URL}/agents", json=payload, headers=headers)
            if r.status_code == 200:
                agent = r.json()
                config.AGENTS.append(agent)
                config.save_config(agents=config.AGENTS)
                self.refresh_nodes()
            else:
                messagebox.showerror("Error", f"Failed to create node: {r.text}")
        except Exception as e:
            messagebox.showerror("Error", f"Connection error: {e}")

    def refresh_nodes(self):
        for widget in self.scroll_frame.winfo_children():
            widget.destroy()
            
        max_cpu = psutil.cpu_count()
        max_ram = psutil.virtual_memory().total / (1024**3)
        
        for idx, agent in enumerate(config.AGENTS):
            card = ctk.CTkFrame(self.scroll_frame)
            card.pack(fill="x", pady=5, padx=5)
            
            top_row = ctk.CTkFrame(card, fg_color="transparent")
            top_row.pack(fill="x", padx=10, pady=(10, 5))
            
            name_var = ctk.StringVar(value=agent.get("name", "Unknown"))
            name_entry = ctk.CTkEntry(top_row, textvariable=name_var, width=140, font=ctk.CTkFont(weight="bold"), height=24)
            name_entry.pack(side="left")
            
            status_var = ctk.StringVar(value=agent.get("status", "offline"))
            status_lbl = ctk.CTkLabel(top_row, textvariable=status_var, text_color="gray")
            status_lbl.pack(side="left", padx=10)
            setattr(self, f"statuslbl_{agent['id']}", status_var)
            
            power_switch = ctk.CTkSwitch(
                top_row, text="", width=40,
                command=lambda a=agent, i=idx: self.toggle_power(i)
            )
            power_switch.select() if agent.get("status") != "offline" else power_switch.deselect()
            power_switch.pack(side="right")
            
            # --- Sliders ---
            sliders = ctk.CTkFrame(card, fg_color="transparent")
            sliders.pack(fill="x", padx=10, pady=5)
            
            # CPU
            ctk.CTkLabel(sliders, text="CPU").grid(row=0, column=0, padx=5)
            cpu_slider = ctk.CTkSlider(sliders, from_=1, to=max_cpu, number_of_steps=max_cpu-1)
            cpu_slider.set(agent.get("cpu_cores", 1))
            cpu_slider.grid(row=0, column=1, sticky="we", padx=5)
            
            # RAM
            ctk.CTkLabel(sliders, text="RAM").grid(row=1, column=0, padx=5)
            ram_slider = ctk.CTkSlider(sliders, from_=1, to=max_ram)
            ram_slider.set(agent.get("ram_gb", 1.0))
            ram_slider.grid(row=1, column=1, sticky="we", padx=5)
            
            sliders.grid_columnconfigure(1, weight=1)
            
            save_btn = ctk.CTkButton(
                card, text="Apply Settings", height=24,
                command=lambda i=idx, n=name_var, c=cpu_slider, r=ram_slider: self.apply_limits(i, n.get(), c.get(), r.get())
            )
            save_btn.pack(pady=(0, 10), padx=10, fill="x")

    def toggle_power(self, idx):
        agent = config.AGENTS[idx]
        new_status = "idle" if agent.get("status") == "offline" else "offline"
        agent["status"] = new_status
        config.save_config(agents=config.AGENTS)
        
        headers = {"Authorization": f"Bearer {config.TOKEN}"}
        try:
            requests.patch(f"{config.API_URL}/agents/{agent['id']}", json={"status": new_status}, headers=headers)
        except:
            pass

    def apply_limits(self, idx, name, cpu, ram):
        agent = config.AGENTS[idx]
        agent["name"] = name
        agent["cpu_cores"] = int(cpu)
        agent["ram_gb"] = round(float(ram), 1)
        config.save_config(agents=config.AGENTS)
        
        headers = {"Authorization": f"Bearer {config.TOKEN}"}
        try:
            requests.patch(f"{config.API_URL}/agents/{agent['id']}", json={"name": name, "cpu_cores": int(cpu), "ram_gb": round(float(ram), 1)}, headers=headers)
            messagebox.showinfo("Applied", f"Settings updated seamlessly.")
        except Exception as e:
            messagebox.showerror("Error", str(e))

    def update_loop(self):
        if not hasattr(self, "rotation"):
            self.rotation = 0
            
        if config.TOKEN:
            for agent in config.AGENTS:
                aid = agent["id"]
                if hasattr(self, f"statuslbl_{aid}"):
                    lbl = getattr(self, f"statuslbl_{aid}")
                    if agent.get("status") == "offline":
                        lbl.set("Offline")
                    else:
                        lbl.set(manager.statuses.get(aid, "Idle"))
            
            is_run = manager.is_any_running()
            new_state = "running" if is_run else "idle"
        else:
            new_state = "offline"
            
        # Animate rotation if running
        if new_state == "running":
            self.rotation = (self.rotation + 30) % 360
            
        # Update tray if state changed OR if we are animating
        if self.icon_state != new_state or new_state == "running":
            self.icon_state = new_state
            if self.tray_icon:
                self.tray_icon.icon = self.create_tray_image(new_state, self.rotation)
                self.tray_icon.title = f"Hive Node: {new_state.capitalize()}"
        
        # 500ms loop for smooth animation
        self.after(500, self.update_loop)

    def create_tray_image(self, state, rotation=0):
        color = "red"
        if state == "running": color = "orange"
        elif state == "idle": color = "yellow"
        
        image = Image.new('RGBA', (64, 64), (255, 255, 255, 0))
        dc = ImageDraw.Draw(image)
        dc.ellipse((8, 8, 56, 56), fill=color, outline="black")
        
        if state == "running":
            # Draw a rotating dark arc to simulate processing/arrows
            dc.pieslice((16, 16, 48, 48), start=rotation, end=rotation+270, fill="#cc5500")
            
        return image

    def hide_window(self):
        self.withdraw()

    def show_window(self, icon, item):
        self.icon_state = "" # Force refresh
        self.deiconify()
        self.lift()
        self.attributes('-topmost', True)
        self.attributes('-topmost', False)

    def stop_app(self, icon, item):
        manager.stop()
        if self.tray_icon:
            self.tray_icon.stop()
        self.quit()
        self.destroy()

    def setup_tray(self):
        menu = pystray.Menu(
            pystray.MenuItem("Open Dashboard", self.show_window, default=True),
            pystray.MenuItem("Exit", self.stop_app)
        )
        self.tray_icon = pystray.Icon("HiveAgent", self.create_tray_image("offline"), "Hive Node", menu)
        self.tray_thread = threading.Thread(target=self.tray_icon.run, daemon=True)
        self.tray_thread.start()

if __name__ == "__main__":
    app = HiveApp()
    try:
        app.mainloop()
    except KeyboardInterrupt:
        manager.stop()
        os._exit(0)
