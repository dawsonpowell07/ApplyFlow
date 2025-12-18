import { CopilotChat } from "@copilotkit/react-ui"; 
import { CopilotKit } from "@copilotkit/react-core"; 

export default function ChatTab() {
  return (
    <div className="space-y-6">
      <CopilotKit runtimeUrl="/api/copilotkit" agent="strands_agent">
        <CopilotChat/>
      </CopilotKit>
    </div>
  );
}
