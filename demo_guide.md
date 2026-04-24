# Hive CI/CD - Academic Advisor Presentation Demo 🎓

This guide is designed to perfectly showcase the **High-Performance Distributed Computing (HPC)** capabilities we just built. Follow this script step-by-step to demonstrate the Array Cloning, Load Balancing, and Sandboxing to your advisor.

---

### Step 1: The Setup
1. Open your terminal and start your backend: `uvicorn app.main:app`
2. Start your frontend: `npm run dev`
3. Launch your Python Desktop Agent App.

### Step 2: The Hardware Grid (The "Wow" Factor)
Your advisor needs to see that this isn't just a simple server; it's a **distributed grid**.
1. In the Desktop App, click **"Add Node"** exactly **3 times**.
2. You will now see 3 identical computational agents (e.g., `Node-1`, `Node-2`, `Node-3`).
3. Toggle all 3 switches to **Online**. 
*(Explain to your advisor: "These represent 3 physical computers on our grid waiting for work.")*

### Step 3: Triggering the Slurm Array
1. Open up your web browser (localhost:3000) and go to **Submit New Job**.
2. **Upload:** Select the `calculate_pi.zip` file (This holds our mathematical Monte Carlo simulator).
3. **Run Command:** Type strictly `python calculate_pi.py`
4. **Array Task Nodes:** Set this to massive numbers to prove parallelization! Set it to **`30`**.
5. Set **CPU = 1** and **RAM = 0.5**.
6. Hit **Submit Job**.

### Step 4: The Execution Reveal
Immediately switch your screen back to the **Desktop Agent UI**.
* **What your advisor will see:** All 3 nodes will instantaneously light up with a "Running" status. 
* **The Pitch:** "Because we implemented a **Worst-Fit Scheduling Algorithm**, the Master Database did not just cram all 30 jobs onto Node 1. It mathematically balanced the load, instantly delivering exactly 10 tasks to Node 1, 10 to Node 2, and 10 to Node 3."

### Step 5: Log Verification
1. On the web dashboard, click into the tracking details for one of the active jobs.
2. In the Live Logs, your advisor will see an output looking like:
   `Allocated Task Node ID: #17`
   `Workload: Monte Carlo Pi Estimation`
* **The Pitch:** "We didn't just clone the file physically—we used **Slurm-style Environment Variable Injection**. The Agent dynamically pushes `HIVE_ARRAY_INDEX` into the isolated Docker container. The Python script reads this container boundary to generate a unique random mathematical seed without network overhead."

### Optional Bonus: Live Disaster Recovery!
If you want to absolutely floor your advisor:
1. While the 30 tasks are running across the 3 Nodes... **Turn Node 2 Offline mid-execution.**
2. Tell your advisor: "Node 2 just suffered a fatal hardware crash in our simulated datacenter."
3. Wait exactly **15 seconds**. 
4. The remaining Nodes (1 and 3) will auto-detect the orphaned tasks in the database and re-queue them. You will see Nodes 1 and 3 instantly pick up the slack and finish those lost jobs automatically!

### Step 6: Multi-Step Pipeline (The "Real-World workflows" Pitch)
1. On the web dashboard, click **Submit New Job**.
2. Toggle the UI to **Multi-Step Pipeline**.
3. Create 3 distinct steps:
   - **Step 1:** Name: `Install`, Command: `pip install -r requirements.txt`
   - **Step 2:** Name: `Test`, Command: `pytest`
   - **Step 3:** Name: `Deploy`, Command: `python deploy.py`
4. Leave Array Task Nodes at 1, and hit **Submit Pipeline**.
5. *Wait for execution to start, or show the pipeline UI.*

**The Pitch (1 Minute Script):** 
>"Now, let me show you our Multi-Step Pipeline feature. In the real world, CI/CD isn't just about running one giant script; it's about orchestrating complex, sequential workflows—like installing dependencies, running unit tests, and finally deploying. 
>
>Instead of a user forcing everything into one black-box script, they define discrete steps right here in our dashboard. When I click submit, the Hive agent takes over and executes each phase strictly in order. 
>
>Crucially, if the 'Test' step throws a non-zero exit code because a unit test failed, the entire pipeline immediately halts at that exact point and logs the failure. It never blindly attempts the 'Deploy' step. This ensures safety, saves valuable compute credits from being wasted, and perfectly mirrors industry-standard tools like GitHub Actions or Jenkins—but it's built natively on top of our custom distributed compute grid!"
