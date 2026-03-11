import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type WishlistEntry = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  gender: string;
  city: string;
  created_at: string;
};

const AdminWishlist = () => {
  const [entries, setEntries] = useState<WishlistEntry[]>([]);

  useEffect(() => {
    (supabase as any)
      .from("companion_wishlist")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }: any) => setEntries(data || []));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Companion Wishlist</h1>
      <p className="text-sm text-muted-foreground mb-4">Users who want to list their profile as a chat companion.</p>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.name}</TableCell>
                <TableCell>{e.email || "—"}</TableCell>
                <TableCell>{e.gender}</TableCell>
                <TableCell>{new Date(e.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No wishlist entries yet</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AdminWishlist;
