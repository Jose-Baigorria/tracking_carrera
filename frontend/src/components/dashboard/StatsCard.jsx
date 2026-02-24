import React from 'react';
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function StatsCard({ title, value, subtitle, icon: Icon, color, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
        >
            <Card className="relative overflow-hidden border-none bg-gradient-to-br from-slate-800 to-slate-900 p-6">
                <div className={`absolute -top-10 -right-10 w-32 h-32 ${color} opacity-10 rounded-full blur-2xl`} />
                <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
                            <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
                        </div>
                    </div>
                    <h3 className="text-slate-400 text-sm font-medium mb-2">{title}</h3>
                    <p className="text-3xl font-bold text-white mb-1">{value}</p>
                    {subtitle && <p className="text-slate-500 text-xs">{subtitle}</p>}
                </div>
            </Card>
        </motion.div>
    );
}