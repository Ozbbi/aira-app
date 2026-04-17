import AsyncStorage from '@react-native-async-storage/async-storage';
import { createUser, getUser, NetworkError } from '../api/client';
import type { User } from '../types';

const USER_ID_KEY = 'aira_user_id';

export async function getSavedUserId(): Promise<string | null> {
  return AsyncStorage.getItem(USER_ID_KEY);
}

export async function getOrCreateUser(name: string): Promise<User> {
  const savedId = await AsyncStorage.getItem(USER_ID_KEY);

  if (savedId) {
    try {
      const user = await getUser(savedId);
      return user;
    } catch (err) {
      if (err instanceof NetworkError) throw err;
      // User not found on server — maybe data was wiped. Create fresh.
      await AsyncStorage.removeItem(USER_ID_KEY);
    }
  }

  // Create new user
  const newUser = await createUser(name);
  // Backend returns `id`, our mobile type uses `userId` — normalize
  const userId = (newUser as unknown as { id?: string }).id ?? newUser.userId;
  await AsyncStorage.setItem(USER_ID_KEY, userId);
  return { ...newUser, userId };
}

export async function fetchExistingUser(): Promise<User | null> {
  const savedId = await AsyncStorage.getItem(USER_ID_KEY);
  if (!savedId) return null;

  try {
    const user = await getUser(savedId);
    return { ...user, userId: savedId };
  } catch {
    return null;
  }
}

export async function clearUser(): Promise<void> {
  await AsyncStorage.removeItem(USER_ID_KEY);
}
