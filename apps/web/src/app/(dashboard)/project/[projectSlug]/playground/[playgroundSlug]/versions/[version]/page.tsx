import type { Metadata, ResolvingMetadata } from "next";

import { api } from "@/trpc/server";

type Props = {
  params: {
    projectSlug: string;
    playgroundSlug: string;
    version: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const workflow = await api.craft.module.meta.query({
    projectSlug: params.projectSlug,
    workflowSlug: params.playgroundSlug,
  });

  return {
    title: `${workflow?.name} | ${workflow?.project.name}`,
  };
}

const PlaygroundVersionsPage: React.FC<Props> = async (props) => {
  const workflow = await api.craft.module.meta.query({
    projectSlug: props.params.projectSlug,
    workflowSlug: props.params.playgroundSlug,
  });
  if (!workflow) return <div>Not found</div>;
  return (
    <div className="flex h-full flex-col">
      <section className="flex flex-col divide-y">
        <h1 className="text-2xl">Version {workflow.version?.version}</h1>
        <p>{workflow.version?.changeLog}</p>
      </section>
    </div>
  );
};

export default PlaygroundVersionsPage;
