import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import StatusDot from "./StatusDot";

const AgentCard = ({ agent }: { agent: any }) => {
    return (
        <Card className="mb-4">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-bold">{agent.name}</CardTitle>
                    <StatusDot status={agent.status} />
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm">Cores: {agent.cpu_cores} | RAM: {agent.ram_gb.toFixed(1)} GB</p>
                <div className="mt-2 text-xs text-gray-500">
                    Load: {agent.current_cpu_usage}% CPU
                </div>
            </CardContent>
        </Card>
    );
};

export default AgentCard;
