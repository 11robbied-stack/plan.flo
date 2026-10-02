import {requireChatGPTUser} from '@/app/chatgpt-auth';
import OnboardingForm from './onboarding-form';
export default async function Page(){await requireChatGPTUser('/onboarding');return <OnboardingForm/>}
