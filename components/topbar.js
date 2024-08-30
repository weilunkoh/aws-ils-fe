import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from 'next/router';
import { Disclosure } from '@headlessui/react';
import { LogoutIcon, MenuIcon, XIcon } from '@heroicons/react/outline';
import { get_navigation } from "../props/navigation";
import { get_username_cookie, delete_auth_cookie } from "../helper/authCookie";

const Topbar = () => {
  const router = useRouter();
  const currentRoute = router.pathname;
  const [navigation, setNavigation] = useState();
  const [username, setUsername] = useState();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (get_username_cookie() == "") {
      router.push("/login");
    } else {
      setNavigation(get_navigation());
      setUsername(get_username_cookie());
      setVerified(true);
    }
  }, [router]);
  
  const classNames = (...classes) => {
    // Filter just to make sure no null values.
    return classes.filter(Boolean).join(' ')
  }

  const handleLogout = () => {
    delete_auth_cookie();
    router.push("/login");
  }

  return (verified && 
    <Disclosure as="nav" className="bg-gray-800">
      {({ open }) => (
        <>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Image
                    src="/smu-logo.png"
                    height={45}
                    width={80}
                    alt="Singapore Management University"
                  />
                </div>
                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-4">
                    {navigation.map((item) => (
                      item.show && <Link key={item.name} href={item.href[0]}>
                        <a
                          className={classNames(
                            item.href.includes(currentRoute)
                              ? 'bg-gray-900 text-white'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                            'px-3 py-2 rounded-md text-sm font-medium'
                          )}
                          aria-current={item.href.includes(currentRoute) ? 'page' : undefined}
                        >
                          {item.name}
                        </a>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="ml-4 flex items-center md:ml-6">
                  <Link href="/profile">
                    <p className="text-white text-sm font-medium mr-2 hover:bg-gray-700 cursor-pointer px-3 py-2 rounded-md">
                      {username}
                    </p>
                  </Link>
                  <button
                    type="button"
                    className="bg-gray-800 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                    onClick={() => handleLogout()}
                  >
                    <span className="sr-only">Logout</span>
                    <LogoutIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="-mr-2 flex md:hidden">
                {/* Mobile menu button */}
                <Disclosure.Button className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <MenuIcon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navigation.map((item) => (
                item.show && <Link key={item.name} href={item.href[0]}>
                  <Disclosure.Button
                    as="a"
                    className={classNames(
                      item.href.includes(currentRoute) ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                      'block px-3 py-2 rounded-md text-base font-medium'
                    )}
                    aria-current={item.href.includes(currentRoute) ? 'page' : undefined}
                  >
                    {item.name}
                  </Disclosure.Button>
                </Link>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-700">
              <div className="flex items-center px-5">
                <Link href="/profile">
                  <p className="text-white text-base font-medium">
                    {username}
                  </p>
                </Link>
                <button
                  type="button"
                  className="ml-auto bg-gray-800 flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                  onClick={() => handleLogout()}
                >
                  <span className="sr-only">Logout</span>
                  <LogoutIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  )
}

export default Topbar;