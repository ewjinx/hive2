"use client";

import React, { useEffect, useState } from "react";
import AgentCard from "@/components/AgentCard";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function AgentsPage() {
    const [agents, setAgents] = useState([]);

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            const res = await api.get("/agents/");
            setAgents(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Network Agents</h1>
                <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>Back</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {agents.map((agent: any) => (
                    <AgentCard key={agent.id} agent={agent} />
                ))}
            </div>
        </div>
    );
}
