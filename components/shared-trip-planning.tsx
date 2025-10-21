"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Users,
  Plus,
  UserPlus,
  MessageCircle,
  Check,
  X,
  Crown,
  Mail,
  Share2,
  Link as LinkIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TripMember {
  id: string
  name: string
  email: string
  avatar?: string
  role: "owner" | "editor" | "viewer"
  status: "active" | "pending"
  joinedAt?: string
}

export function SharedTripPlanning() {
  const [members, setMembers] = useState<TripMember[]>([
    {
      id: "1",
      name: "Nguyễn Văn A",
      email: "nguyenvana@email.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=1",
      role: "owner",
      status: "active",
      joinedAt: "2025-10-01",
    },
    {
      id: "2",
      name: "Trần Thị B",
      email: "tranthib@email.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=2",
      role: "editor",
      status: "active",
      joinedAt: "2025-10-05",
    },
    {
      id: "3",
      name: "Lê Văn C",
      email: "levanc@email.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=3",
      role: "viewer",
      status: "active",
      joinedAt: "2025-10-08",
    },
    {
      id: "4",
      name: "Phạm Thị D",
      email: "phamthid@email.com",
      role: "editor",
      status: "pending",
    },
  ])

  const [inviteEmail, setInviteEmail] = useState("")
  const [selectedRole, setSelectedRole] = useState<"editor" | "viewer">("editor")

  const inviteMember = () => {
    if (inviteEmail) {
      const newMember: TripMember = {
        id: Date.now().toString(),
        name: inviteEmail.split("@")[0],
        email: inviteEmail,
        role: selectedRole,
        status: "pending",
      }
      setMembers([...members, newMember])
      setInviteEmail("")
    }
  }

  const removeMember = (id: string) => {
    setMembers(members.filter(member => member.id !== id))
  }

  const changeRole = (id: string, newRole: "editor" | "viewer") => {
    setMembers(members.map(member => 
      member.id === id ? { ...member, role: newRole } : member
    ))
  }

  const activeMembers = members.filter(m => m.status === "active")
  const pendingMembers = members.filter(m => m.status === "pending")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2 flex items-center">
            <Users className="w-6 h-6 mr-3 text-primary" />
            Lập kế hoạch cùng nhóm
          </h2>
          <p className="text-muted-foreground">
            Mời bạn bè và lên kế hoạch chuyến đi cùng nhau
          </p>
        </div>
        <Button>
          <Share2 className="w-4 h-4 mr-2" />
          Chia sẻ chuyến đi
        </Button>
      </div>

      {/* Share Link */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-blue-500/10">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <LinkIcon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Link chia sẻ chuyến đi</h3>
            <div className="flex items-center space-x-2">
              <Input
                readOnly
                value="https://luxestay.com/trip/abc123xyz"
                className="bg-background"
              />
              <Button variant="outline">
                <LinkIcon className="w-4 h-4 mr-2" />
                Sao chép
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Bất kỳ ai có link này đều có thể xem chuyến đi của bạn
            </p>
          </div>
        </div>
      </Card>

      {/* Invite Members */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Mời thành viên mới</h3>
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Email</label>
            <Input
              type="email"
              placeholder="nhap@email.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && inviteMember()}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Quyền hạn</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as "editor" | "viewer")}
            >
              <option value="editor">Chỉnh sửa</option>
              <option value="viewer">Chỉ xem</option>
            </select>
          </div>
          <Button onClick={inviteMember}>
            <UserPlus className="w-4 h-4 mr-2" />
            Gửi lời mời
          </Button>
        </div>
      </Card>

      {/* Active Members */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">
            Thành viên ({activeMembers.length})
          </h3>
        </div>
        <div className="space-y-3">
          {activeMembers.map(member => (
            <div
              key={member.id}
              className="flex items-center space-x-4 p-4 rounded-lg border hover:shadow-sm transition-shadow"
            >
              <Avatar className="w-12 h-12">
                {member.avatar ? (
                  <AvatarImage src={member.avatar} alt={member.name} />
                ) : (
                  <AvatarFallback>{member.name[0]}</AvatarFallback>
                )}
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="font-semibold">{member.name}</p>
                  {member.role === "owner" && (
                    <Crown className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Mail className="w-3 h-3" />
                  <span>{member.email}</span>
                </div>
                {member.joinedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Tham gia: {new Date(member.joinedAt).toLocaleDateString("vi-VN")}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {member.role !== "owner" ? (
                  <>
                    <select
                      className="text-sm rounded-md border border-input bg-background px-2 py-1"
                      value={member.role}
                      onChange={(e) => changeRole(member.id, e.target.value as "editor" | "viewer")}
                    >
                      <option value="editor">Chỉnh sửa</option>
                      <option value="viewer">Chỉ xem</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMember(member.id)}
                    >
                      <X className="w-4 h-4 text-destructive" />
                    </Button>
                  </>
                ) : (
                  <Badge variant="default">
                    <Crown className="w-3 h-3 mr-1" />
                    Chủ sở hữu
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Pending Invitations */}
      {pendingMembers.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">
            Lời mời đang chờ ({pendingMembers.length})
          </h3>
          <div className="space-y-3">
            {pendingMembers.map(member => (
              <div
                key={member.id}
                className="flex items-center space-x-4 p-4 rounded-lg border bg-muted/50"
              >
                <Avatar className="w-12 h-12">
                  <AvatarFallback>{member.name[0]}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{member.name}</p>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Mail className="w-3 h-3" />
                    <span>{member.email}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    Đang chờ
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMember(member.id)}
                  >
                    <X className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Permissions Info */}
      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-3">Quyền hạn thành viên</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Crown className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">Chủ sở hữu</span>
            </div>
            <ul className="text-muted-foreground space-y-1 ml-6">
              <li>• Toàn quyền quản lý</li>
              <li>• Thêm/xóa thành viên</li>
              <li>• Xóa chuyến đi</li>
            </ul>
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Check className="w-4 h-4 text-green-500" />
              <span className="font-medium">Chỉnh sửa</span>
            </div>
            <ul className="text-muted-foreground space-y-1 ml-6">
              <li>• Thêm/sửa lịch trình</li>
              <li>• Thêm địa điểm</li>
              <li>• Bình luận</li>
            </ul>
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="font-medium">Chỉ xem</span>
            </div>
            <ul className="text-muted-foreground space-y-1 ml-6">
              <li>• Xem lịch trình</li>
              <li>• Xem địa điểm</li>
              <li>• Bình luận</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
