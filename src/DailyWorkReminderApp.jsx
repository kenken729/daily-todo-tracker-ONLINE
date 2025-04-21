import React, { useEffect, useState } from "react";
import { format, isBefore, isToday, isWithinInterval, parseISO } from "date-fns";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://uaynxcgnbwivxmkkkpqe.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVheW54Y2duYndpdnhta2trcHFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MDkyMTMsImV4cCI6MjA2MDQ4NTIxM30.7SS7iuTet6bdsCnYtmRlqEMc4DzzAzJfShNVVMrBnyo"
);

const people = [
  "佳平", "潘霆", "彥銘", "姿穎", "育全", "鈺庭",
  "佳宇", "琪珊", "雄欽", "達那", "韋燕",
  "妍麗", "小希", "張琪", "志賢"
];

export default function DailyWorkReminderApp() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ content: "", due: "", owners: [] });
  const [showTextOutput, setShowTextOutput] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      const { data, error } = await supabase.from("DailyWorkReminder").select("*");
      if (!error && data) {
        const valid = data.filter(t => t.owners && Array.isArray(t.owners));
        setTasks(valid);
      }
    };
    fetchTasks();
  }, []);

  const handleAddTask = async () => {
    if (!newTask.content || newTask.owners.length === 0) {
      alert("請輸入代辦項目與負責人");
      return;
    }

    const resolveOwners = () => {
      let resolved = [];
      newTask.owners.forEach((o) => {
        if (o === "所有人") resolved.push(...people);
        else if (o === "國內") resolved.push("佳平", "潘霆", "彥銘", "姿穎", "育全", "鈺庭");
        else if (o === "海外") resolved.push("佳宇", "琪珊", "雄欽", "達那", "韋燕");
        else resolved.push(o);
      });
      return [...new Set(resolved)];
    };

    const owners = resolveOwners();
    const dueDate = newTask.due || new Date().toISOString().split("T")[0];
    const contentParts = newTask.content.split("、").map(s => s.trim()).filter(Boolean);

    const entries = owners.flatMap((owner) =>
      contentParts.map((part) => ({
        content: part,
        due: dueDate,
        owners: [owner],
        createdAt: new Date().toISOString(),
        completed: false
      }))
    );

    const { error } = await supabase.from("DailyWorkReminder").insert(entries);
    if (error) {
      console.error("新增任務失敗", error);
      alert("儲存到雲端失敗，請稍後再試");
    } else {
      const { data: refreshed } = await supabase.from("DailyWorkReminder").select("*");
      setTasks(refreshed || []);
      setNewTask({ content: "", due: "", owners: [] });
    }
  };

  return <div>（略）</div>; // 其餘渲染略
}
