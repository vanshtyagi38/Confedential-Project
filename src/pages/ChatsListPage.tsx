import { MessageCircle } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const ChatsListPage = () => {
  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background pb-24">
      <div className="px-4 py-4">
        <h1 className="text-lg font-bold">Your Chats</h1>
      </div>
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
          <MessageCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-base font-semibold">No chats yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Start chatting with a companion from the home screen!
        </p>
      </div>
      <BottomNav />
    </div>
  );
};

export default ChatsListPage;
