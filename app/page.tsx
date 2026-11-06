import { requireChatGPTUser } from './chatgpt-auth';
import MobileApp from './mobile-app';
export const dynamic='force-dynamic';
export default async function Page(){await requireChatGPTUser('/');return <MobileApp/>;}
