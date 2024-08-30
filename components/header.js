const Header = (props) => {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl tracking-tight font-bold text-gray-900">{props.title}</h1>
        <p>{props.description}</p>
      </div>
    </header>
  )
}

export default Header;