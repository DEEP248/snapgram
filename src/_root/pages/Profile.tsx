import {
  Route,
  Routes,
  Link,
  Outlet,
  useParams,
  useLocation,
} from "react-router-dom";

import { LikedPosts, queryClient } from "@/_root/pages";
import { useUserContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import GridPostList from "./GridPostList";
import Loader from "@/components/ui/shared/Loader";
import { useFollowUser, useGetUserById } from "@/lib/react-query/queriesAndMutations";
import { useEffect, useState } from "react";
import { QUERY_KEYS } from "@/lib/react-query/querykey";

interface StabBlockProps {
  value: string | number;
  label: string;
}

const StatBlock = ({ value, label }: StabBlockProps) => (
  <div className="flex-center gap-2">
    <p className="small-semibold lg:body-bold text-primary-500">{value}</p>
    <p className="small-medium lg:base-medium text-light-2">{label}</p>
  </div>
);

const Profile = () => {
  const { id } = useParams();
  const { user } = useUserContext();
  const { pathname } = useLocation();

  const { data: currentUser } = useGetUserById(id || "");
  const followUserMutation = useFollowUser();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(currentUser?.following?.length || 0);

  // ⚡ Set initial values from the server when currentUser is loaded
  useEffect(() => {
    if (currentUser && user) {
      const isUserFollowing = currentUser.followers?.includes(user.id);
      setIsFollowing(isUserFollowing || false);
      setFollowerCount(currentUser.followers?.length || 0);
      setFollowingCount(currentUser.following?.length || 0);
    }
  }, [currentUser, user]);

  const handleFollowClick = async () => {
    if (!id || !user?.id) return;
  
    // Optimistically update the state
    setIsFollowing((prev) => !prev);
    setFollowerCount((prev) => prev + (isFollowing ? -1 : 1));
    //setFollowingCount((prev) => prev + (isFollowing ? -1 : 1)); // Update following count optimistically
  
    // Perform the mutation
    followUserMutation.mutate(
      { targetUserId: id, currentUserId: user.id },
      {
        onSuccess: () => {
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GET_USER_BY_ID, id] }); // Target user's data
          queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GET_USER_BY_ID, user.id] }); // Current user's data
        },
        onError: (error) => {
          console.error("Follow/Unfollow failed:", error);
  
          // Revert optimistic updates if the mutation fails
          setIsFollowing((prev) => !prev);
          setFollowerCount((prev) => prev + (isFollowing ? 1 : -1));
          setFollowingCount((prev:number) => prev + (isFollowing ? 1 : -1)); // Revert following count
        },
      }
    );
  };

  if (!currentUser)
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );

  return (
    <div className="profile-container">
      <div className="profile-inner_container">
        <div className="flex xl:flex-row flex-col max-xl:items-center flex-1 gap-7">
          <img
            src={
              currentUser.imageUrl || "/assets/icons/profile-placeholder.svg"
            }
            alt="profile"
            className="w-28 h-28 lg:h-36 lg:w-36 rounded-full"
          />
          <div className="flex flex-col flex-1 justify-between md:mt-2">
            <div className="flex flex-col w-full">
              <h1 className="text-center xl:text-left h3-bold md:h1-semibold w-full">
                {currentUser.name}
              </h1>
              <p className="small-regular md:body-medium text-light-3 text-center xl:text-left">
                @{currentUser.username}
              </p>
            </div>

            <div className="flex gap-8 mt-10 items-center justify-center xl:justify-start flex-wrap z-20">
              <StatBlock value={currentUser.posts.length} label="Posts" />
              <StatBlock value={followerCount} label="Followers" />
              <StatBlock value={followingCount} label="Following" />
            </div>

            <p className="small-medium md:base-medium text-center xl:text-left mt-7 max-w-screen-sm">
              {currentUser.bio}
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <div className={`${user.id !== currentUser.$id && "hidden"}`}>
              <Link
                to={`/update-profile/${currentUser.$id}`}
                className={`h-12 bg-dark-4 px-5 text-light-1 flex-center gap-2 rounded-lg ${
                  user.id !== currentUser.$id && "hidden"
                }`}>
                <img
                  src={"/assets/icons/edit.svg"}
                  alt="edit"
                  width={20}
                  height={20}
                />
                <p className="flex whitespace-nowrap small-medium">
                  Edit Profile
                </p>
              </Link>
            </div>
           {/* Follow / Following Button */}
           <div className={`${user.id === id && "hidden"}`}>
                <Button
                    type="button"
                    size="sm"
                    className={`px-8 transition-all duration-300 ${
                      isFollowing
                        ? "bg-white text-black border border-primary-500"
                        : "shad-button_primary"
                    }`}
                    onClick={handleFollowClick}
                    disabled={user.id === id} // Disable button for current user's profile
                    style={{
                      opacity: 1,
                      cursor: user.id === id ? "default" : "pointer", // Cursor changes to default for the current user
                      pointerEvents: user.id === id ? "none" : "auto", // Prevent interaction if it's the current user's profile
                    }}
                  >
                {isFollowing ? "Following" : "Follow"}  {/* 🆕 Text changes */}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {currentUser.$id === user.id && (
        <div className="flex max-w-5xl w-full">
          <Link
            to={`/profile/${id}`}
            className={`profile-tab rounded-l-lg ${
              pathname === `/profile/${id}` && "!bg-dark-3"
            }`}>
            <img
              src={"/assets/icons/posts.svg"}
              alt="posts"
              width={20}
              height={20}
            />
            Posts
          </Link>
          <Link
            to={`/profile/${id}/liked-posts`}
            className={`profile-tab rounded-r-lg ${
              pathname === `/profile/${id}/liked-posts` && "!bg-dark-3"
            }`}>
            <img
              src={"/assets/icons/like.svg"}
              alt="like"
              width={20}
              height={20}
            />
            Liked Posts
          </Link>
        </div>
      )}

      <Routes>
        <Route
          index
          element={<GridPostList posts={currentUser.posts} showUser={false} />}
        />
        {currentUser.$id === user.id && (
          <Route path="/liked-posts" element={<LikedPosts />} />
        )}
      </Routes>
      <Outlet />
    </div>
  );
};

export default Profile;