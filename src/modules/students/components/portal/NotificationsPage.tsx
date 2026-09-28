import { Bell, Megaphone, Calendar, FileText, CheckCircle2 } from "lucide-react";

export function NotificationsPage() {
  const notifications = [
    {
      id: "1",
      type: "announcement",
      title: "Semester Final Exams Schedule Released",
      description: "The schedule for the upcoming semester finals is now available. Please check the Exams & Results tab for your specific dates.",
      date: "2026-09-27",
      isRead: false,
    },
    {
      id: "2",
      type: "fee",
      title: "Upcoming Fee Installment Due",
      description: "A reminder that your second semester tuition fee installment is due next week. Please clear all dues to avoid late fees.",
      date: "2026-09-25",
      isRead: false,
    },
    {
      id: "3",
      type: "academic",
      title: "Assignment Submission Deadline",
      description: "Last date to submit your Mini Project report is this Friday.",
      date: "2026-09-24",
      isRead: true,
    },
    {
      id: "4",
      type: "system",
      title: "Student Portal Maintenance",
      description: "The portal will undergo scheduled maintenance this weekend from 12 AM to 4 AM.",
      date: "2026-09-20",
      isRead: true,
    },
  ];

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  function getIcon(type: string) {
    switch (type) {
      case "announcement":
        return <Megaphone className="h-5 w-5 text-indigo-600" />;
      case "fee":
        return <FileText className="h-5 w-5 text-rose-600" />;
      case "academic":
        return <Calendar className="h-5 w-5 text-emerald-600" />;
      default:
        return <Bell className="h-5 w-5 text-slate-600" />;
    }
  }

  function getBgColor(type: string) {
    switch (type) {
      case "announcement":
        return "bg-indigo-50";
      case "fee":
        return "bg-rose-50";
      case "academic":
        return "bg-emerald-50";
      default:
        return "bg-slate-100";
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="sp-card">
        <div className="sp-card-header">
          <div>
            <h2 className="sp-card-title">
              <Bell className="h-4 w-4 sp-card-title-icon" />
              Notifications
            </h2>
            <p className="sp-card-subtitle mt-1">
              Stay updated with the latest announcements, reminders, and alerts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-red-700">
                {unreadCount} Unread
              </span>
            )}
            <button className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Mark all as read
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 p-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-4 rounded-xl p-4 transition-colors hover:bg-slate-50 ${
                !notification.isRead ? "bg-blue-50/30" : ""
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getBgColor(
                  notification.type
                )}`}
              >
                {getIcon(notification.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3
                    className={`text-sm ${
                      !notification.isRead ? "font-bold text-slate-950" : "font-semibold text-slate-700"
                    }`}
                  >
                    {notification.title}
                  </h3>
                  <span className="text-xs font-semibold text-slate-400">
                    {new Date(notification.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                  {notification.description}
                </p>
              </div>
              {!notification.isRead && (
                <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
