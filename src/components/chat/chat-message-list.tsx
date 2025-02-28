"use client";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAutoScroll } from "@/hooks/useAutoScroll";

interface ChatMessageListProps extends React.HTMLAttributes<HTMLDivElement> {}

const ChatMessageList = ({
	className,
	children,
	...props
}: ChatMessageListProps) => {
	const { scrollRef, isAtBottom, scrollToBottom, disableAutoScroll } =
		useAutoScroll({
			smooth: true,
			content: children,
		});

	return (
		<div className="relative w-full h-full">
			<div
				className={`flex flex-col w-full h-full p-4 overflow-y-auto ${className}`}
				ref={scrollRef}
				onWheel={disableAutoScroll}
				onTouchMove={disableAutoScroll}
				{...props}
			>
				<div className="flex flex-col gap-6">{children}</div>
			</div>

			{!isAtBottom && (
				<Button
					onClick={() => {
						scrollToBottom();
					}}
					size="icon"
					variant="outline"
					className="absolute bottom-2 left-1/2 transform -translate-x-1/2 inline-flex rounded-full shadow-md"
					aria-label="Scroll to bottom"
				>
					<ArrowDown className="h-4 w-4" />
				</Button>
			)}
		</div>
	);
};

export { ChatMessageList };
