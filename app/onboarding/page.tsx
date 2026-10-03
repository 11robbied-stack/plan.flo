import {requireChatGPTUser} from '@/app/chatgpt-auth';
import {companyDb} from '@/app/company-access';
import type {RegistrationProfile} from '@/app/registration-profile';
import OnboardingForm from './onboarding-form';
export default async function Page(){const user=await requireChatGPTUser('/onboarding');const draft=user.userId.startsWith('auth:')?await companyDb().prepare('SELECT business_name AS businessName,abn,address,phone,rec FROM auth_user WHERE id=?').bind(user.userId.slice(5)).first<Partial<RegistrationProfile>>():null;return <OnboardingForm defaults={draft||{}}/>}
