import { redirect } from "next/navigation";

const Page = async (props: { params: Promise<{ environmentId: string }> }) => {
  const params = await props.params;
  // Redirect to unified settings page
  redirect(`/environments/${params.environmentId}/settings/general`);
};

export default Page;
