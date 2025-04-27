import { Models } from "appwrite";
import { Link } from "react-router-dom";
import { useUserContext } from "@/context/AuthContext";
import { Button } from "../button";


type UserCardProps = {
  user: Models.Document;
};

const UserCard = ({ user }: UserCardProps) => {
   // 🆕 Local state to handle Follow/Following
   const { user: loggedInUser } = useUserContext(); // 🆕 Get logged-in user

  const isCurrentUser = loggedInUser?.id === user.$id; // 🆕 Check if it's same user

  return (
    <Link to={`/profile/${user.$id}`} className="user-card">
      <img
        src={user.imageUrl || "/assets/icons/profile-placeholder.svg"}
        alt="creator"
        className="rounded-full w-14 h-14"
      />

      <div className="flex-center flex-col gap-1">
        <p className="base-medium text-light-1 text-center line-clamp-1">
          {user.name}
        </p>
        <p className="small-regular text-light-3 text-center line-clamp-1">
          @{user.username}
        </p>
      </div>

      <Button
        type="button"
        size="sm"
        className="shad-button_primary px-5"
        disabled={isCurrentUser}
        style={{
          opacity: 1,
          cursor: "pointer",
          pointerEvents: "none",
        }}
      >
        {isCurrentUser ? "Your Profile" : "Visit Profile"}
      </Button>
    </Link>
  );
};

export default UserCard;