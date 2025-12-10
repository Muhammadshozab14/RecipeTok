"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "./UserAvatar";

export default function Navigation() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
              VideoShare
            </Link>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Explore
              </Link>
              <Link
                href="/feed"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Feed
              </Link>
              <Link
                href="/upload"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Upload
              </Link>
              {user && (
                <Link href={`/users/${user.id}`} className="flex items-center gap-2">
                  <UserAvatar username={user.username} size="sm" />
                  <span className="hidden sm:inline text-gray-700">{user.username}</span>
                </Link>
              )}
              <button
                onClick={logout}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
