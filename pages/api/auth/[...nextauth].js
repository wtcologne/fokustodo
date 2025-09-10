// pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

export const authOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      // nützliche Infos an den Token hängen
      if (account?.provider === "github" && profile) {
        token.githubId = profile.id?.toString();
        token.name = profile.name || token.name;
        token.email = profile.email || token.email;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.githubId || token.sub;
      return session;
    },
  },
};

// WICHTIG für "pages/api": Default-Export!
export default NextAuth(authOptions);
