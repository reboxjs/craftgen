import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormField, FormItem } from "@/components/ui/form";
import { sendFeedback } from "../actions";
import { useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
const formSchema = z.object({
  feedback: z.string().min(3),
  satisfaction: z.enum(["awesome", "good", "bad", "worst"]),
});

export const FeedbackButton = () => {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });
  const { toast } = useToast();
  const satisfaction = form.watch("satisfaction");
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    await sendFeedback(data);
    form.reset();
    toast({
      title: "Thank you ! - Feedback sent",
      description: "We will review your feedback and get back to you soon.",
    });
    setOpen(false);
  };
  const placeholder = useMemo(() => {
    switch (satisfaction) {
      case "awesome":
        return "What did you like the most?";
      case "good":
        return "What can we improve?";
      case "bad":
        return "What did you not like?";
      default:
        return "Your feedback...";
    }
  }, [satisfaction]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant={"outline"} size="sm">
          Feedback
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <Textarea placeholder={placeholder} {...field} />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between w-full">
              <FormField
                control={form.control}
                name="satisfaction"
                render={({ field }) => (
                  <FormItem>
                    <Button
                      variant={field.value === "awesome" ? "outline" : "ghost"}
                      className="text-xl"
                      onClick={() => field.onChange("awesome")}
                    >
                      🤩
                    </Button>
                    <Button
                      variant={field.value === "good" ? "outline" : "ghost"}
                      className="text-xl"
                      onClick={() => field.onChange("good")}
                    >
                      😊
                    </Button>
                    <Button
                      variant={field.value === "bad" ? "outline" : "ghost"}
                      className="text-xl"
                      onClick={() => field.onChange("bad")}
                    >
                      😫
                    </Button>
                  </FormItem>
                )}
              />
              <Button
                size={"sm"}
                type="submit"
                variant={"secondary"}
                loading={form.formState.isSubmitting}
              >
                Submit
              </Button>
            </div>
          </form>
        </Form>
      </PopoverContent>
    </Popover>
  );
};
