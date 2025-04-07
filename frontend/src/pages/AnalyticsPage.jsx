import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { MessageSquare, Users, Star } from "lucide-react";

const AnalyticsPage = () => {
  const { analytics, fetchAnalytics, isFetchingAnalytics } = useAuthStore();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const topFriend = analytics?.mostChattedFriends?.[0];

  return (
    <div className="min-h-screen pt-20 px-6 pb-10 bg-base-200">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Chat Analytics</h1>
          <p className="text-base-content/60">Track your messaging stats and trends</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-base-100 rounded-xl p-5 shadow flex items-center gap-4">
            <MessageSquare className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-zinc-500">Total Messages</p>
              <p className="text-lg font-semibold">
                {analytics?.totalMessages ?? (isFetchingAnalytics ? "..." : 0)}
              </p>
            </div>
          </div>

          <div className="bg-base-100 rounded-xl p-5 shadow flex items-center gap-4">
            <Users className="w-8 h-8 text-secondary" />
            <div>
              <p className="text-sm text-zinc-500">Total Chats</p>
              <p className="text-lg font-semibold">
                {analytics?.totalChats ?? (isFetchingAnalytics ? "..." : 0)}
              </p>
            </div>
          </div>

          <div className="bg-base-100 rounded-xl p-5 shadow flex items-center gap-4 col-span-1 sm:col-span-2">
            <Star className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-sm text-zinc-500">Top Friend</p>
              <p className="text-lg font-semibold">
                {topFriend
                  ? `${topFriend.fullName} (${topFriend.messageCount} messages)`
                  : isFetchingAnalytics
                  ? "Loading..."
                  : "No chats yet"}
              </p>
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-base-100 rounded-xl p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">Top 5 Most Chatted Friends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={analytics?.mostChattedFriends?.map(friend => ({
                name: friend.fullName,
                messages: friend.messageCount,
              })) ?? []}
            >
              <XAxis dataKey="name" stroke="#888" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="messages" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
