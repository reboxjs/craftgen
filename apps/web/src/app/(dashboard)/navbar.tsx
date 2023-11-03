"use client";

import { PropsWithChildren } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Session } from "@supabase/supabase-js";
import { Network, Slash } from "lucide-react";

import { ModeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { FeedbackButton } from "./components/feedback-button";
import { TeamSwitcher } from "./components/team-switcher";
import { UserNav } from "./components/user-nav";

export const Navbar: React.FC<PropsWithChildren<{ session?: Session }>> = ({
  children,
  session,
}) => {
  const params = useParams();
  return (
    <div className="bg-background fixed z-50 h-12 w-full">
      <div className="flex w-full items-center justify-between p-1">
        <div className="flex items-center">
          <div className="mr-4 flex p-2">
            <Link href="/dashboard">
              <Network />
            </Link>
          </div>
          {session && (
            <>
              {params.projectSlug && <TeamSwitcher />}
              {params.playgroundSlug && (
                <>
                  <Slash className="text-muted-foreground mx-2 h-4 w-4 -rotate-12" />
                  <Link
                    href={`/${params.projectSlug}/${params.playgroundSlug}`}
                  >
                    <span>{params.playgroundSlug}</span>
                  </Link>
                </>
              )}
            </>
          )}
        </div>
        <div className="flex items-center space-x-2 px-2">
          <FeedbackButton />
          <ModeToggle />
          {session && <UserNav session={session} />}
          {!session && (
            <Link href="/login">
              <Button> Sign up</Button>
            </Link>
          )}
        </div>
      </div>
      {/* <div>
        {params.projectSlug && session && <ProjectNavbar session={session} />}
      </div> */}
    </div>
  );
};

const links = [
  {
    name: "Overview",
    href: (projectSlug: string) => `/${projectSlug}`,
  },
  // {
  //   name: "Articles",
  //   href: (projectSlug: string) => `/${projectSlug}/articles`,
  // },
  {
    name: "Settings",
    href: (projectSlug: string) => `/${projectSlug}/settings`,
  },
];

const ProjectNavbar: React.FC<{ session: Session }> = ({ session }) => {
  const params = useParams();
  const pathname = usePathname();
  return (
    <div className="space-x-4 px-4">
      {links.map((link) => (
        <Link
          href={link.href(params?.projectSlug as string)}
          key={link.name}
          className={cn(
            "m-2 p-1 transition-all duration-200",
            "hover:bg-primary/10 hover:rounded",
            pathname === link.href(params?.projectSlug as string) &&
              "border-primary border-b-2",
          )}
        >
          {link.name}
        </Link>
      ))}
    </div>
  );
};
