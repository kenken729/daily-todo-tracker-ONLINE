import React, { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { supabase } from "./supabaseClient";

const people = [
  "佳平", "潘霆", "彥銘", "姿穎", "育全", "鈺庭",
  "佳宇", "琪珊", "雄欽", "達那", "韋燕",
  "妍麗", "小希", "張琪", "志賢"
];

export default function DailyWorkReminderApp() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ content: "", due: "", owners: [] });

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("DailyWorkReminder")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error) setTasks(data);
  };

  useEffect(() => {
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
        else if (o === "海外") resolved.push("佳宇", "雄欽", "琪珊", "達那", "韋燕");
        else resolved.push(o);
      });
      return [...new Set(resolved)];
    };

    const owners = resolveOwners();
    const dueDate = newTask.due || new Date().toISOString().split("T")[0];

    const contentParts = newTask.content.split("、").map(p => p.trim()).filter(Boolean);
    const entries = owners.flatMap(owner =>
      contentParts.map(content => ({
        content,
        due: dueDate,
        owners: [owner],
        created_at: new Date().toISOString(),
        completed: false
      }))
    );

    const { error } = await supabase.from("DailyWorkReminder").insert(entries);
    if (!error) {
      fetchTasks();
      setNewTask({ content: "", due: "", owners: [] });
    }
  };

  const toggleComplete = async (task) => {
    await supabase.from("DailyWorkReminder")
      .update({ completed: !task.completed })
      .eq("id", task.id);
    fetchTasks();
  };

  const removeTask = async (taskId) => {
    await supabase.from("DailyWorkReminder")
      .delete()
      .eq("id", taskId);
    fetchTasks();
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>每日代辦事項</h1>
      <input
        type="text"
        value={newTask.content}
        onChange={(e) => setNewTask({ ...newTask, content: e.target.value })}
        placeholder="任務內容"
      />
      <input
        type="date"
        value={newTask.due}
        onChange={(e) => setNewTask({ ...newTask, due: e.target.value })}
      />
      <div>
        {[...["所有人", "國內", "海外"], ...people].map((p) => (
          <label key={p} style={{ marginRight: "1rem" }}>
            <input
              type="checkbox"
              checked={newTask.owners.includes(p)}
              onChange={() =>
                setNewTask({
                  ...newTask,
                  owners: newTask.owners.includes(p)
                    ? newTask.owners.filter(o => o !== p)
                    : [...newTask.owners, p]
                })
              }
            />
            {p}
          </label>
        ))}
      </div>
      <button onClick={handleAddTask}>新增</button>

      <hr />

      {people.map(person => {
        const list = tasks.filter(t => t.owners.includes(person) && !t.completed);
        return (
          <div key={person}>
            <h3>👤 {person}</h3>
            {list.map(task => (
              <div key={task.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <div>
                  <strong>{task.content}</strong>｜⏰ {format(parseISO(task.due), "yyyy-MM-dd")}
                </div>
                <div>
                  <button onClick={() => toggleComplete(task)}>完成</button>
                  <button onClick={() => removeTask(task.id)}>刪除</button>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
