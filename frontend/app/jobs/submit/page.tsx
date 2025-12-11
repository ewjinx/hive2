"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import api from "@/lib/api";

export default function SubmitJob() {
    const [file, setFile] = useState<File | null>(null);
    const [runCmd, setRunCmd] = useState("");
    const [cpu, setCpu] = useState(1);
    const [ram, setRam] = useState(1);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("run_command", runCmd);
        formData.append("cpu_req", cpu.toString());
        formData.append("ram_req", ram.toString());

        try {
            await api.post("/jobs/", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            router.push("/dashboard");
        } catch (e) {
            console.error(e);
            alert("Failed to submit job");
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Submit New Job</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Project Zip (Max 10MB)</label>
                            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Run Command</label>
                            <Input value={runCmd} onChange={(e) => setRunCmd(e.target.value)} placeholder="python main.py" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">CPU Cores</label>
                                <Input type="number" value={cpu} onChange={(e) => setCpu(Number(e.target.value))} min={1} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">RAM (GB)</label>
                                <Input type="number" value={ram} onChange={(e) => setRam(Number(e.target.value))} min={0.5} step={0.5} />
                            </div>
                        </div>
                        <Button type="submit" className="w-full">Submit Job</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
