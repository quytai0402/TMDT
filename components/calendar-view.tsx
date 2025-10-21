"use client"

export function CalendarView() {
  const daysInMonth = 31
  const firstDayOfWeek = 3 // Wednesday
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

  // Mock booking data
  const bookings = [15, 16, 17, 18, 19, 22, 23, 24, 25]

  return (
    <div>
      <div className="grid grid-cols-7 gap-2 mb-2">
        {days.map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const isBooked = bookings.includes(day)
          const isToday = day === 10

          return (
            <button
              key={day}
              className={`aspect-square p-2 rounded-lg border transition-colors ${
                isBooked
                  ? "bg-primary text-white border-primary"
                  : isToday
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-muted"
              }`}
            >
              <span className="text-sm font-medium">{day}</span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center space-x-6 mt-6 pt-6 border-t border-border">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-primary" />
          <span className="text-sm text-muted-foreground">Đã đặt</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded border-2 border-primary" />
          <span className="text-sm text-muted-foreground">Hôm nay</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded border border-border" />
          <span className="text-sm text-muted-foreground">Còn trống</span>
        </div>
      </div>
    </div>
  )
}
