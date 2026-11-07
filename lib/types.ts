export type Opportunity = {
 id: string; title: string; organization: string; type: string; url: string; description: string;
 skills: string[]; categories: string[]; costLabel: string; format: string; location: string;
 deadline: string | null; availability: string; lastVerified: string; duration?: string;
 durationLabel?: string; dateLabel?: string; language?: string; statusNote?: string; endsAt?: string; evidence?: string; own?: boolean; status?: string; linkCheck?: {code:number; checkedAt:string};
};
export type Profile = {name:string; career:string; university:string; cycle:number; target:string; skills:string[]; hours:number; bio:string};
export type Mentor = {id:string;name:string;role:string;organization:string;area:string;bio:string;topics:string[];demo:boolean;own?:boolean;career?:string;cycle?:number};
export type MentorRequest = {id:string;user_id:string;mentor_id:string;sender_name:string;message:string;status:string;is_demo:number;created_at:string;incoming:boolean};
export type Bootstrap = {user:{id:string;name:string;email:string};profile:Profile|null;opportunities:Opportunity[];saved:{opportunity_id:string;stage:string;created_at:string}[];progress:Record<string,boolean>;mentors:Mentor[];requests:MentorRequest[];feedbackCount:number};
export type Task = {id:string;title:string;description:string;kind:string;opportunityId?:string;week:number};
