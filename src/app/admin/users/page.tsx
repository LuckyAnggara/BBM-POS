
'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, MoreHorizontal, Search, Filter, Mail, UserCheck, UserX } from "lucide-react";
import type { User, UserRole } from '@/lib/types'; // Updated import
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchUsers, deleteUserById, updateUserActiveStatus } from './actions';

const roleColors: Record<UserRole, string> = {
  ADMIN: 'bg-destructive text-destructive-foreground',
  MANAGER: 'bg-primary text-primary-foreground',
  STAFF: 'bg-secondary text-secondary-foreground',
};


export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedUsers = await fetchUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      toast.error("Failed to load users.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleDeleteUser = (userId: string, userName: string) => {
    toast.warning(`Are you sure you want to delete user "${userName}"?`, {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await deleteUserById(userId);
            toast.success(`User "${userName}" deleted.`);
            loadUsers(); // Refresh user list
          } catch (error) {
            toast.error(`Failed to delete user "${userName}".`);
          }
        }
      },
      cancel: { label: 'Cancel' }
    });
  };

  const toggleUserStatus = async (userId: string, currentIsActive: boolean, userName: string) => {
    try {
      await updateUserActiveStatus(userId, !currentIsActive);
      toast.success(`User "${userName}" status updated.`);
      loadUsers(); // Refresh user list
    } catch (error) {
      toast.error(`Failed to update status for "${userName}".`);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <CardTitle className="font-headline">User Management</CardTitle>
          <CardDescription>Manage users, their roles, and access permissions.</CardDescription>
        </div>
        <Button disabled> {/* TODO: Implement Add User Page */}
          <PlusCircle className="mr-2 h-4 w-4" /> Add New User
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name, email, or role..."
                className="w-full rounded-lg bg-background pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Placeholder for role filter dropdown */}
            <Button variant="outline" disabled>
              <Filter className="mr-2 h-4 w-4" />
              Filter by Role
            </Button>
        </div>
        {isLoading ? (
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-[120px] mb-1" />
                        <Skeleton className="h-3 w-[150px]" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[90px] rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-8 w-[30px] mx-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">No users found.</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search or add a new user.</p>
            </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatarUrl || undefined} alt={user.name} data-ai-hint="user avatar" />
                        <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                           <Mail className="h-3 w-3"/> {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${roleColors[user.role]} text-xs px-2 py-0.5`}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'default' : 'outline'} className={`text-xs px-2 py-0.5 ${user.isActive ? 'bg-green-500/20 text-green-700 border-green-500/30' : 'bg-red-500/10 text-red-700 border-red-500/20'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {user.lastLogin ? formatDistanceToNow(parseISO(user.lastLogin), { addSuffix: true }) : 'Never'}
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled> {/* TODO: Implement Edit User Page */}
                          <Edit className="mr-2 h-4 w-4" /> Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleUserStatus(user.id, user.isActive, user.name)}>
                          {user.isActive ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                           {user.isActive ? 'Deactivate' : 'Activate'} User
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteUser(user.id, user.name)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
