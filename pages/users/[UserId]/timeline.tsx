import ActivityTimeline from "@/components/ActivityTimeline/ActivityTimeline";
import { Users } from "@/lib/models/users";

type Props = {
  user: Users | null;
};

export default function UserTimeline({ user }: Props) {
  if (!user?.id) return null;

  return (
    <div className="w-full animate-in fade-in duration-500 pt-2">
      <ActivityTimeline userId={user.id} />
    </div>
  );
}
