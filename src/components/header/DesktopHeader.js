import React, { useState, useCallback, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import Menu from "../Menu";
import Search from "../Search";

const DesktopHeader = ({ username }) => {
  const [visible, setVisible] = useState(false);

  const toggleVisibility = useCallback(() => setVisible(!visible), [visible]);

  const navRef = useRef();
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (visible && navRef.current && !navRef.current.contains(event.target)) {
        toggleVisibility();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [visible, toggleVisibility]);

  return (
    <header className="py-2 bg-gray-100">
      <div className="grid grid-cols-2 grid-gap-4 justify-center sm:justify-start md:container md:max-w-screen-xl md:mx-auto px-4">
        <div className="flex items-center text-sm font-semibold">
          <div className="text-xl sm:text-2xl font-black mr-3">
            <Link to="/">SS4R</Link>
          </div>
          <div ref={navRef} className="relative mx-auto sm:ml-0">
            <button
              className="flex items-center py-1 px-4"
              onClick={toggleVisibility}
            >
              {`u/${username}`}
              <svg
                className="h-5 w-5"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M14.17,9.35,10,13.53,5.83,9.35a.5.5,0,0,1,.35-.85h7.64a.5.5,0,0,1,.35.85"></path>
              </svg>
            </button>
            <div
              className={`${
                visible
                  ? "sm:absolute top-full bg-gray-100 w-full z-10"
                  : "hidden"
              }`}
            >
              <Menu toggleVisibility={toggleVisibility} />
            </div>
          </div>
        </div>
        <Search />
      </div>
    </header>
  );
};

export default DesktopHeader;
