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
      const { data, error } = await supabase.from("tasks").select("*");
      if (!error && data) {
        setTasks(data);
      }
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = async () => {
    if (!newTask.content) {
      alert("請輸入代辦項目內容");
      return;
    }
    if (newTask.owners.length === 0) {
      alert("請選擇至少一位負責人");
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
    const contentParts = newTask.content.split("、").map(part => part.trim()).filter(Boolean);

    const entries = owners.flatMap((owner) =>
      contentParts.map((part) => ({
        content: part,
        due: dueDate,
        owners: [owner],
        createdAt: new Date().toISOString(),
        completed: false
      }))
    );

    const { data, error } = await supabase.from("tasks").insert(entries);
    if (!error) {
      setTasks([...tasks, ...entries]);
      setNewTask({ content: "", due: "", owners: [] });
    }
  };

  const toggleOwner = (owner) => {
    setNewTask((prev) => ({
      ...prev,
      owners: prev.owners.includes(owner)
        ? prev.owners.filter((o) => o !== owner)
        : [...prev.owners, owner]
    }));
  };

  const toggleComplete = async (id) => {
    const target = tasks.find((t) => t.id === id);
    const updated = { ...target, completed: !target.completed };
    await supabase.from("tasks").update({ completed: updated.completed }).eq("id", id);
    setTasks(tasks.map((t) => (t.id === id ? updated : t)));
  };

  const removeTask = async (id) => {
    await supabase.from("tasks").delete().eq("id", id);
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const getColor = (due) => {
    const today = new Date();
    if (!due) return "#fff";
    const dueDate = parseISO(due);
    if (isToday(dueDate)) return "#fff9c4";
    if (isBefore(dueDate, today)) return "#ffcdd2";
    if (isWithinInterval(dueDate, { start: today, end: new Date(today.getTime() + 6 * 86400000) }))
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
        text += `\n👤 ${person}\n`;

        personTasks.forEach((task) => {
          const dueDate = parseISO(task.due);
          const today = new Date();
          const isTodayDue = isToday(dueDate);
          const isOverdue = isBefore(dueDate, today);

          const isEnglish = ["小希", "妍麗", "達那"].includes(person);
          const label = isEnglish ? "Due" : "截止日";
          const todayText = isEnglish ? "｜⚠️ Due Today" : "｜⚠️ 今日截止";
          const overdueText = isEnglish ? "｜⚠️ Overdue" : "｜⚠️ 已逾期";

          text += `- ${task.content}｜⏰ ${label}：${format(dueDate, "yyyy-MM-dd")}`;
          if (isTodayDue) text += todayText;
          else if (isOverdue) text += overdueText;
          text += "\n";
        });
      }
    });
    return text.trim();
  };

  const sortedPendingTasks = tasks.filter((t) => !t.completed).sort((a, b) => new Date(a.due) - new Date(b.due));
  const sortedCompletedTasks = tasks.filter((t) => t.completed).sort((a, b) => new Date(b.due) - new Date(a.due));

  return (
    <div style={{ maxWidth: "1200px", margin: "auto", fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', Arial, Helvetica, sans-serif", fontWeight: "500" }}>
      <h1 style={{ fontSize: "1.8rem", fontWeight: "bold" }}>待辦清單（雲端同步）</h1>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
        <textarea
          style={{ width: "40%" }}
          value={newTask.content}
          placeholder="輸入代辦內容"
          onChange={(e) => setNewTask({ ...newTask, content: e.target.value })}
        />
        <input
          type="date"
          value={newTask.due}
          onChange={(e) => setNewTask({ ...newTask, due: e.target.value })}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {["所有人", "國內", "海外", ...people].map((p) => (
            <label key={p}>
              <input
                type="checkbox"
                checked={newTask.owners.includes(p)}
                onChange={() => toggleOwner(p)}
              /> {p}
            </label>
          ))}
        </div>
        <button onClick={handleAddTask}>新增</button>
        <button onClick={() => setShowTextOutput(!showTextOutput)}>產生清單</button>
      </div>

      {showTextOutput && (
        <textarea
          readOnly
          style={{ width: "100%", height: "200px", whiteSpace: "pre-wrap", marginBottom: "1.5rem" }}
          value={generateTextOutput()}
        />
      )}

      <div style={{ display: "flex", gap: "2rem" }}>
        {[false, true].map((isCompleted) => (
          <div key={String(isCompleted)} style={{ flex: 1 }}>
            <h2>{isCompleted ? "✅ 已完成" : "📌 待辦項目"}</h2>
            {people.map((person) => {
              const list = (isCompleted ? sortedCompletedTasks : sortedPendingTasks).filter((t) => t.owners.includes(person));
              return (
                <div key={person} style={{ marginBottom: "1rem" }}>
                  <h3>👤 {person}</h3>
                  {list.length > 0 ? (
                    list.map((task) => (
                      <div
                        key={task.id}
                        style={{
                          background: getColor(task.due),
                          padding: "0.5rem",
                          marginBottom: "0.5rem",
                          borderRadius: "6px"
                        }}
                      >
                        <strong>{task.content}</strong><br />
                        ⏰ {format(parseISO(task.due), "yyyy-MM-dd")}｜建立：{format(parseISO(task.createdAt), "yyyy-MM-dd")}
                        <div>
                          <button onClick={() => toggleComplete(task.id)}>{isCompleted ? "還原" : "完成"}</button>
                          <button onClick={() => removeTask(task.id)}>移除</button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: "#777" }}>（無代辦事項）</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
