'use client';

/**
 * 프로필 수정 페이지
 * 위치: src/app/(main)/profile/edit/page.tsx
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { getUser, isLoggedIn, clearAuth, authFetch } from '@/lib/auth';
import { getMyProfile, updateProfile } from '@/features/profile/api';

export default function ProfileEditPage() {
  const router = useRouter();
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    bio: '',
    avatarUrl: '',
    website: '',
    location: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!isLoggedIn()) {
        router.push('/auth');
        return;
      }

      try {
        const profileData = await getMyProfile();
        setFormData({
          username: profileData.username || '',
          fullName: profileData.fullName || '',
          bio: profileData.bio || '',
          avatarUrl: profileData.avatarUrl || '',
          website: profileData.website || '',
          location: profileData.location || '',
        });
      } catch (error) {
        console.error('Failed to load profile:', error);
        toast.error('프로필을 불러올 수 없습니다');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateProfile({
        username: formData.username || undefined,
        fullName: formData.fullName || undefined,
        bio: formData.bio || undefined,
        avatarUrl: formData.avatarUrl || undefined,
        website: formData.website || undefined,
        location: formData.location || undefined,
      });
      toast.success('프로필이 저장되었습니다');
      router.push('/profile');
    } catch (error: any) {
      toast.error(error.message || '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    // 서버에 로그아웃 요청
    const refreshToken =
      typeof window !== 'undefined'
        ? localStorage.getItem('refreshToken')
        : null;
    if (refreshToken) {
      try {
        await authFetch('/api/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      } catch (e) {
        console.error('Logout failed:', e);
      }
    }
    clearAuth();
    toast.success('로그아웃되었습니다');
    router.push('/auth');
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText === '탈퇴') {
      // TODO: 계정 삭제 API 호출
      toast.success('계정이 삭제되었습니다');
      router.push('/auth');
    }
  };

  const handleAvatarChange = () => {
    // TODO: 이미지 업로드 구현
    toast.info('프로필 사진 변경 기능 준비 중');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/profile')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">프로필 수정</h1>
          <Button
            variant="ghost"
            onClick={handleSave}
            disabled={saving}
            className="text-foreground hover:bg-accent"
          >
            {saving ? '저장 중...' : '완료'}
          </Button>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-6">
        <div className="bg-card rounded-xl p-6 space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={formData.avatarUrl || undefined} />
                <AvatarFallback className="bg-mocha/20 text-mocha text-2xl font-bold">
                  {formData.username?.[0] || formData.fullName?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                onClick={handleAvatarChange}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={handleAvatarChange}>
              프로필 사진 변경
            </Button>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">사용자명</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              placeholder="사용자명을 입력하세요"
            />
            <p className="text-xs text-muted-foreground">
              영문, 숫자, 밑줄만 사용 가능 (3~20자)
            </p>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">이름</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              placeholder="이름을 입력하세요"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">소개</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              placeholder="자신을 소개해주세요"
              rows={4}
            />
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">웹사이트</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) =>
                setFormData({ ...formData, website: e.target.value })
              }
              placeholder="https://..."
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">위치</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="서울, 대한민국"
            />
          </div>

          {/* Account Info */}
          <div className="pt-4 border-t space-y-4">
            <h3 className="font-semibold">계정 정보</h3>
            <div className="space-y-2">
              <Label>이메일</Label>
              <p className="text-sm text-muted-foreground">
                {getUser()?.email || '이메일 없음'}
              </p>
            </div>
          </div>

          {/* Logout */}
          <div className="pt-4 border-t">
            <Button variant="ghost" className="w-full" onClick={handleLogout}>
              로그아웃
            </Button>
          </div>

          {/* Delete Account */}
          <div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full text-destructive hover:text-destructive"
                >
                  계정 삭제
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    정말로 계정을 삭제하시겠습니까?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-4">
                    <p>
                      이 작업은 되돌릴 수 없습니다. 계정을 삭제하면 모든 레시피,
                      팔로워, 저장된 콘텐츠가 영구적으로 삭제됩니다.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-text">
                        계속하려면 <strong>&quot;탈퇴&quot;</strong>를
                        입력하세요
                      </Label>
                      <Input
                        id="confirm-text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="탈퇴"
                      />
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
                    취소
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== '탈퇴'}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    삭제
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
