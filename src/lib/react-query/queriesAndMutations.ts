import { INewPost, INewUser, IUpdatePost, IUpdateUser } from '@/types';
import { createPost, createUserAccount, deletePost, deleteSavedPost, getCurrentUser, getInfinitePosts, getPostById, getRecentPosts, getUserById, getUserPosts, getUsers, likePost, savePost, searchPosts, signInAccount, signOutAccount, updatePost, updateUser } from '../appwrite/api';
import {
  useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from './querykey';
import { appwriteConfig, databases } from '../appwrite/config';

export const useCreateUserAccount = () => {
    return useMutation({
        mutationFn: (user: INewUser) => createUserAccount(user),
    })
};

export const useSignInAccount = () => {
    return useMutation({
        mutationFn: (user: { email: string; password: string }) => signInAccount(user),
    })
};

export const useSignOutAccount = () => {
    return useMutation({
        mutationFn: signOutAccount,
    })
};

export const useCreatePost = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (post: INewPost) => createPost(post),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
        });
      },
    });
};

export const useGetRecentPosts = () => {
    return useQuery({
      queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      queryFn: getRecentPosts,
    });
};

export const useLikePost = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ postId, likesArray,}: { postId: string; likesArray: string[];}) => 
        likePost(postId, likesArray),
      
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_POST_BY_ID, data?.$id],
        });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
        });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_POSTS],
        });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_CURRENT_USER],
        });
      },
    });
};

export const useSavePost = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ userId, postId }: { userId: string; postId: string }) =>
        savePost(userId, postId),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
        });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_POSTS],
        });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_CURRENT_USER],
        });
      },
    });
};

export const useDeleteSavedPost = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (savedRecordId: string) => deleteSavedPost(savedRecordId),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
        });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_POSTS],
        });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_CURRENT_USER],
        });
      },
    });
};

export const useGetCurrentUser = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_CURRENT_USER],
    queryFn: getCurrentUser,
  });
};

export const useGetPostById = (postId?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_POST_BY_ID, postId],
    queryFn: () => getPostById(postId),
    enabled: !!postId,
  });
};

export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (post: IUpdatePost) => updatePost(post),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_BY_ID, data?.$id],
      });
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, imageId }: { postId?: string; imageId: string }) => deletePost(postId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
    },
  });
};

export const useGetPosts = () => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_INFINITE_POSTS],
    queryFn: getInfinitePosts,
    getNextPageParam: (lastPage) => {
      // If there's no data, there are no more pages.
      if (lastPage && lastPage.documents.length === 0) {
        return null;
      }

      // Use the $id of the last document as the cursor.
      const lastId = lastPage?.documents[lastPage.documents.length - 1].$id;
      return lastId;
    },
  });
};

export const useSearchPosts = (searchTerm: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SEARCH_POSTS, searchTerm],
    queryFn: () => searchPosts(searchTerm),
    enabled: !!searchTerm,
  });
};

export const useGetUsers = (limit?: number) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USERS],
    queryFn: () => getUsers(limit),
  });
};

export const useGetUserPosts = (userId?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USER_POSTS, userId],
    queryFn: () => getUserPosts(userId),
    enabled: !!userId,
  });
};

export const useGetUserById = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USER_BY_ID, userId],
    queryFn: () => getUserById(userId),
    enabled: !!userId,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (user: IUpdateUser) => updateUser(user),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_BY_ID, data?.$id],
      });
    },
  });
};

export const useFollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetUserId, currentUserId }: { targetUserId: string; currentUserId: string }) => {
      // Fetch current target user and current user
      const targetUser = await getUserById(targetUserId);
      const currentUser = await getUserById(currentUserId);

      let updatedFollowers = [...(targetUser?.followers || [])];
      let updatedFollowing = [...(currentUser?.following || [])];

      if (updatedFollowers.includes(currentUserId)) {
        // Unfollow logic
        updatedFollowers = updatedFollowers.filter((id) => id !== currentUserId);
        updatedFollowing = updatedFollowing.filter((id) => id !== targetUserId);
      } else {
        // Follow logic
        updatedFollowers.push(currentUserId);
        updatedFollowing.push(targetUserId);
      }

      console.log("Updated Followers:", updatedFollowers);
      console.log("Updated Following:", updatedFollowing);

      // Update the followers field of the target user
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        targetUserId,
        { followers: updatedFollowers }
      );

      // Update the following field of the current user
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        currentUserId,
        { following: updatedFollowing }
      );
    },
    onSuccess: (_, { targetUserId, currentUserId }) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GET_USER_BY_ID, targetUserId] }); // Target user's data
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GET_USER_BY_ID, currentUserId] }); // Current user's data
    },
    onError: (error) => {
      console.error("Follow/Unfollow failed:", error);
    },
  });
};
