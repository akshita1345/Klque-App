import { montserrat } from "@/app/layout";

export const tourSteps = (driverObj: any) => [
  {
    popover: { // No element implies formatted as a modal
      title: `<span class="text-[20px] font-bold ${montserrat.className}">Welcome to Klque 👋</span>`,
      description: `<div class="${montserrat.className}">
        <p class="mb-4">Klque helps you turn raw thoughts into clear, high-impact content without overthinking.</p>
        <p>This quick tour will show you how to ideate, refine, and save ideas in minutes.</p>
      </div>`,
      align: "center" as "center",
      onNextClick: () => {
        driverObj.current.moveNext();
      }
    }
  },
  {
    element: "#tour-chat-interface",
    popover: {
      title: `<span class="font-bold ${montserrat.className}">Ideate with Ina</span>`,
      description: `<div class="${montserrat.className}">
        <p class="mb-2">This is where we chat! Drop rough thoughts, half-formed ideas, or drafts.</p>
        <p>I (Ina) will help you simplify, sharpen, and structure them. To start off with, we have the full draft of the ideas that you had seen earlier in onboarding, if you like them, I'll show you how to schedule, otherwise drop a message and we can start chatting on different ideas.</p>
      </div>`,
      side: "left" as "left",
      align: "start" as "start",
    }
  },
  {
    element: "#tour-chat-input",
    popover: {
      title: `<span class="font-bold ${montserrat.className}">Ask Ina</span>`,
      description: `<div class="${montserrat.className}">
        <p>Start messy. That’s the point. Type anything here. You don’t need a polished prompt.</p>
        <p>Ina works best with honest, unfiltered input.</p>
      </div>`,
      side: "top" as "top",
      align: "center" as "center",
    }
  },
  {
    element: "#tour-chat-interface", // Fallback target
    popover: {
      title: `<span class="font-bold ${montserrat.className}">Scheduling an Idea</span>`,
      description: `<div class="${montserrat.className}">
        <p>I will walk to you through the flow of drafting and idea and if you like it once you get a final outline from me, you can click <strong>Add to Plan</strong> and select the ones you like to schedule the ideas. You will be able to add it to your calendar by setting a posting date.</p>
      </div>`,
      align: "center" as "center",
    }
  },
  {
    element: "#tour-chat-interface", // Fallback target
    popover: {
      title: `<span class="font-bold ${montserrat.className}">Adding Tasks</span>`,
      description: `<div class="${montserrat.className}">
        <p>I can help you break down posting this content into simple tasks to help make posting easier than ever. Click <strong>Generate Tasks</strong> to see what ideas you want to create tasks for and schedule them to see them in your plan and calendar.</p>
      </div>`,
      align: "center" as "center",
    }
  },
  {
    element: "#tour-response-board",
    popover: {
      title: `<span class="font-bold ${montserrat.className}">Response Board</span>`,
      description: `<div class="${montserrat.className}">
        <p>You will see a "Save Response" button on some chat responses and you can save them here to revisit them later and add them back to chat.</p>
      </div>`,
      align: "center" as "center",
    },
    onDeselected: () => { },
  },
  {
    element: "#tour-sidebar-plan",
    popover: {
      title: `<span class="font-bold ${montserrat.className}">Plan</span>`,
      description: `<div class="${montserrat.className}">
        <p>You can preview and edit your script and tasks here by clicking preview. If you'd like to revisit this script and make more changes using my help, you can simply click on this lightbulb icon.</p>
      </div>`,
      side: "right" as "right",
      align: "center" as "center",
    }
  },
  {
    element: "#tour-sidebar-calendar",
    popover: {
      title: `<span class="font-bold ${montserrat.className}">Calendar</span>`,
      description: `<div class="${montserrat.className}">
        <p>View your monthly and weekly calendar of social media content.</p>
      </div>`,
      side: "right" as "right",
      align: "center" as "center",
    }
  },
  {
    element: "#tour-sidebar-settings",
    popover: {
      title: `<span class="font-bold ${montserrat.className}">Settings</span>`,
      description: `<div class="${montserrat.className}">
        <p>In the settings you can also change any of your onboarding answers and update any information if you'd like. I would just need to do a quick refresh once you do.</p>
      </div>`,
      side: "right" as "right",
      align: "center" as "center",
    }
  },
  {
    popover: {
      title: `<span class="font-bold ${montserrat.className}">You're All Set! 🚀</span>`,
      description: `<div class="${montserrat.className}">
        <p class="mb-4">You’re ready to start turning ideas into content.</p>
        <p>Glad to have you on the platform! Feel free to explore and ask Ina anything. Have fun!</p>
      </div>`,
      align: "center" as "center",
    }
  }
];
