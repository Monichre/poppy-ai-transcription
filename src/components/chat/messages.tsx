import { motion } from "motion/react";
import type { Message } from "ai/react";
import {
	ChatBubbleAvatar,
	ChatBubbleMessage,
} from "@/components/chat/chat-bubble";
import { ChatBubble } from "@/components/chat/chat-bubble";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

export function Messages({
	messages,
	addToolResult,
}: {
	messages: Message[];
	addToolResult: (toolResult: { toolCallId: string; result: string }) => void;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 100 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.7, ease: "easeOut" }}
			className="h-[400px] border rounded-lg flex flex-col w-[50vw] mx-auto"
		>
			<div className="relative p-6 flex-1 overflow-hidden w-full">
				<ChatMessageList>
					{messages.map((message) => (
						<ChatBubble
							key={message.id}
							variant={message.role === "user" ? "sent" : "received"}
						>
							<Avatar className="h-8 w-8 shrink-0">
								<AvatarImage
									src={message.role === "user" ? "user.png" : "/logo.png"}
								/>
							</Avatar>
							<ChatBubbleMessage
								variant={message.role === "user" ? "sent" : "received"}
							>
								{message.parts?.map((part) => {
									switch (part.type) {
										// render text parts as simple text:
										case "text":
											return part.text;

										// for tool invocations, distinguish between the tools and the state:
										case "tool-invocation": {
											const callId = part.toolInvocation.toolCallId;

											switch (part.toolInvocation.toolName) {
												case "askForConfirmation": {
													switch (part.toolInvocation.state) {
														case "call":
															return (
																<div key={callId}>
																	{part.toolInvocation.args.message}
																	<div>
																		<button
																			type="button"
																			onClick={() =>
																				addToolResult({
																					toolCallId: callId,
																					result: "Yes, confirmed.",
																				})
																			}
																		>
																			Yes
																		</button>
																		<button
																			type="button"
																			onClick={() =>
																				addToolResult({
																					toolCallId: callId,
																					result: "No, denied",
																				})
																			}
																		>
																			No
																		</button>
																	</div>
																</div>
															);
														case "result":
															return (
																<div key={callId}>
																	Location access allowed:{" "}
																	{part.toolInvocation.result}
																</div>
															);
														default:
															return null;
													}
												}

												case "researchPoppyAI": {
													switch (part.toolInvocation.state) {
														case "call":
															return (
																<div key={callId}>Researching Poppy AI...</div>
															);
														case "result": {
															// Add block to restrict scope of result declaration
															const result = part.toolInvocation.result as {
																title: string;
																overview?: string;
																description?: string;
																points?: string[];
																website?: string;
															};

															return (
																<div
																	key={callId}
																	className="mt-2 mb-4 bg-zinc-800 p-3 rounded-md"
																>
																	<h3 className="font-semibold mb-2">
																		{result.title}
																	</h3>
																	{result.overview && (
																		<p className="mb-2">{result.overview}</p>
																	)}
																	{result.description && (
																		<p className="mb-2">{result.description}</p>
																	)}
																	{result.points && (
																		<ul className="list-disc pl-5 space-y-1">
																			{result.points.map(
																				(point: string, idx: number) => (
																					<li
																						key={`point-${idx}-${point.substring(0, 10)}`}
																					>
																						{point}
																					</li>
																				)
																			)}
																		</ul>
																	)}
																	{result.website && (
																		<p className="text-sm text-blue-400 mt-2">
																			Source: {result.website}
																		</p>
																	)}
																</div>
															);
														}
														default:
															return null;
													}
												}
												default:
													return null;
											}
										}
										default:
											return null;
									}
								})}
								<br />
							</ChatBubbleMessage>
						</ChatBubble>
					))}

					{/* {isLoading && (
            <ChatBubble variant="received">
              <ChatBubbleAvatar
                className="h-8 w-8 shrink-0"
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&q=80&crop=faces&fit=crop"
                fallback="AI"
              />
              <ChatBubbleMessage isLoading />
            </ChatBubble>
          )} */}
				</ChatMessageList>

				<div className="shrink-0 min-w-[24px] min-h-[24px]" />
			</div>
		</motion.div>
	);
}
