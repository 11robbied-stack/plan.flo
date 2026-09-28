export const feedbackTypes=['Problem','Improvement','Question','Positive feedback'] as const;
export const feedbackImpacts=['Minor inconvenience','Slowing work','Blocking work'] as const;
export const feedbackStatuses=['New','Reviewing','Planned','Resolved','Closed'] as const;
export type FeedbackItem={id:string;sender_name:string;sender_email:string;type:string;impact:string;subject:string;message:string;project_name:string;section:string;status:string;version:number;created:string;updated:string};
