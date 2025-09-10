// pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

const handler = NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      // An GitHub-Daten kommen
      if (account?.provider === "github" && profile) {
        token.githubId = String(profile.id ?? "");
        token.name = profile.name ?? token.name;
        token.email = profile.email ?? token.email;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.githubId || token.sub;
      return session;
    },
  },
});

export default handler; // << WICHTIG bei pages/api
