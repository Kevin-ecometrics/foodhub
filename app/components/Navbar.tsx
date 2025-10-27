import React from "react";
import { MdOutlineShoppingCart } from "react-icons/md";

const Navbar: React.FC = () => {
  return (
    <nav
      className="
    p-4 bg-gray-800 text-white
    "
    >
      <ul className="flex justify-between items-center p-4">
        <li>Menu</li>
        <li>
          <MdOutlineShoppingCart className="text-2xl" />
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
