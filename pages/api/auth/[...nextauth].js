import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

export const authOptions = {
  providers: [GithubProvider({ clientId: process.env.GITHUB_ID, clientSecret: process.env.GITHUB_SECRET })],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "github" && profile) {
        token.githubId = profile.id?.toString();
        token.name = profile.name || token.name;
        token.email = profile.email || token.email;
      }
      return token;
    },
    async session({ session, token }) { session.user.id = token.githubId || token.sub; return session; },
  },
};
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };