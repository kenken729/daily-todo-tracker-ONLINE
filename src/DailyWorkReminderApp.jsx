
import React, { useEffect, useState } from "react";
import { format, isBefore, isToday, isWithinInterval, parseISO } from "date-fns";
import { supabase } from "./supabaseClient";

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
      const { data, error } = await supabase.from("tasks").select("*");
      if (!error) {
        setTasks(data);
      }
    };
    fetchTasks();
  }, []);

  const handleAddTask = async () => {
    if (!newTask.content || newTask.owners.length === 0) {
      alert("請輸入內容與選擇負責人");
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

    const entries = owners.flatMap((owner) =>
      contentParts.map((part) => {
        const task = {
          content: part,
          due: dueDate,
          owners: [owner],
          createdAt: new Date().toISOString(),
          completed: false
        };
        supabase.from("tasks").insert([task]);
        return { ...task, id: Date.now() + Math.random() };
      })
    );
    setTasks((prev) => [...prev, ...entries]);
    setNewTask({ content: "", due: "", owners: [] });
  };

  const toggleOwner = (owner) => {
    setNewTask((prev) => ({
      ...prev,
      owners: prev.owners.includes(owner)
        ? prev.owners.filter((o) => o !== owner)
        : [...prev.owners, owner]
    }));
  };

  const getColor = (due) => {
    const today = new Date();
    if (!due) return "#fff";
    const dueDate = parseISO(due);
    if (isToday(dueDate)) return "#fff9c4";
    if (isBefore(dueDate, today)) return "#ffcdd2";
    if (isWithinInterval(dueDate, { start: today, end: new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000) }))
      return "#c8e6c9";
    return "#f2f2f2";
  };

  const generateTextOutput = () => {
    let text = "";
    people.forEach((person) => {
      const personTasks = tasks
        .filter((task) => task.owners.includes(person) && !task.completed)
        .sort((a, b) => new Date(a.due) - new Date(b.due));

      if (personTasks.length > 0) {
        text += `
👤 ${person}
`;
        personTasks.forEach((task) => {
          const dueDate = parseISO(task.due);
          const isTodayDue = isToday(dueDate);
          const isOverdue = isBefore(dueDate, new Date());
          const isEnglish = ["小希", "妍麗", "達那"].includes(person);
          const label = isEnglish ? "Due" : "截止日";
          const todayText = isEnglish ? "｜⚠️ Due Today" : "｜⚠️ 今日截止";
          const overdueText = isEnglish ? "｜⚠️ Overdue" : "｜⚠️ 已逾期";

          text += `- ${task.content}｜⏰ ${label}：${format(dueDate, "yyyy-MM-dd")}`;
          if (isTodayDue) text += todayText;
          else if (isOverdue) text += overdueText;
          text += "\\n";
        });
      }
    });
    return text.trim();
  };

  const sortedPendingTasks = tasks.filter((t) => !t.completed).sort((a, b) => new Date(a.due) - new Date(b.due));

  return (
    <div style={{ maxWidth: "960px", margin: "auto" }}>
      <h1>📋 待辦事項清單</h1>
      <textarea
        placeholder="輸入新待辦項目"
        value={newTask.content}
        onChange={(e) => setNewTask({ ...newTask, content: e.target.value })}
      />
      <input
        type="date"
        value={newTask.due}
        onChange={(e) => setNewTask({ ...newTask, due: e.target.value })}
      />
      <div>
        {["所有人", "國內", "海外", ...people].map((p) => (
          <label key={p} style={{ marginRight: "1rem" }}>
            <input
              type="checkbox"
              checked={newTask.owners.includes(p)}
              onChange={() => toggleOwner(p)}
            />
            {p}
          </label>
        ))}
      </div>
      <button onClick={handleAddTask}>新增</button>
      <button onClick={() => setShowTextOutput(!showTextOutput)}>
        {showTextOutput ? "隱藏清單" : "產生可複製清單"}
      </button>
      {showTextOutput && (
        <textarea readOnly value={generateTextOutput()} rows={10} style={{ width: "100%" }} />
      )}
      <hr />
      {people.map((person) => {
        const list = sortedPendingTasks.filter((t) => t.owners.includes(person));
        return (
          <div key={person} style={{ marginBottom: "1.5rem" }}>
            <h3>👤 {person}</h3>
            {list.map((task) => (
              <div key={task.id} style={{ background: getColor(task.due), padding: "0.5rem", marginBottom: "0.5rem" }}>
                <strong>{task.content}</strong>
                <div style={{ fontSize: "0.8rem" }}>
                  截止：{format(parseISO(task.due), "yyyy-MM-dd")}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
