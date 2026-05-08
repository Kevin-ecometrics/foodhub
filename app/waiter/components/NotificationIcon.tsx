interface NotificationIconProps {
  type: string;
}

const ICONS: Record<string, { emoji: string; color: string; bg: string }> = {
  new_order:     { emoji: "🍽️", color: "var(--green)",  bg: "var(--green-light)"  },
  assistance:    { emoji: "🙋",  color: "var(--amber)",  bg: "var(--amber-light)"  },
  bill_request:  { emoji: "🧾",  color: "var(--red)",    bg: "var(--red-light)"    },
  order_updated: { emoji: "🔔",  color: "var(--blue)",   bg: "var(--blue-light)"   },
  table_freed:   { emoji: "✅",  color: "var(--green)",  bg: "var(--green-light)"  },
};

export default function NotificationIcon({ type }: NotificationIconProps) {
  const cfg = ICONS[type] || { emoji: "🔔", color: "var(--muted)", bg: "var(--surface)" };
  return (
    <div style={{ width:42,height:42,borderRadius:12,background:cfg.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>
      {cfg.emoji}
    </div>
  );
}
