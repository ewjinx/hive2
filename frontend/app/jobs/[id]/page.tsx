"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import StatusDot from "@/components/StatusDot";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function JobDetails() {
    const { id } = useParams();
    const [job, setJob] = useState<any>(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchJob();
        const interval = setInterval(fetchJob, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [id]);

    const fetchJob = async () => {
        try {
            const jobRes = await api.get(`/jobs/${id}`);
            setJob(jobRes.data);

            const logsRes = await api.get(`/jobs/${id}/logs`);
            setLogs(logsRes.data);
            setLoading(false);
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!job) return <div>Job not found</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Job #{job.id}</h1>
                <StatusDot status={job.status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p><strong>Status:</strong> {job.status}</p>
                        <p><strong>Cost:</strong> {job.cost.toFixed(4)} credits</p>
                        <p><strong>CPU:</strong> {job.cpu_req} Cores</p>
                        <p><strong>RAM:</strong> {job.ram_req} GB</p>
                        <p><strong>Agent ID:</strong> {job.agent_id || "Unassigned"}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Commands</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="text-sm text-gray-500">Run Command:</p>
                        <code className="bg-gray-100 p-1 rounded block">{job.run_command}</code>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Logs</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-black text-white p-4 rounded h-64 overflow-y-auto font-mono text-sm">
                        {logs.map((log: any, i) => (
                            <div key={i}>{log.content}</div>
                        ))}
                        {logs.length === 0 && <span className="text-gray-500">No logs yet...</span>}
                    </div>
                </CardContent>
            </Card>

            <div className="mt-4">
                <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>Back to Dashboard</Button>
            </div>
        </div>
    );
}
