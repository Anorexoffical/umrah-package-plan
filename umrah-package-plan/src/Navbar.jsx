import { NavLink } from 'react-router-dom';

const Navbar = () => {
  const links = [
    { to: '/', label: '🏠 Home' },
    { to: '/package-creation', label: '✏️ Package Creation' },
    { to: '/pattern-generator', label: '📋 Pattern' },
    { to: '/package-calculator', label: '💰 Calculator' },
    { to: '/rooms', label: '🏨 Rooms' },
  ];

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '0 24px',
      height: '60px',
      background: 'linear-gradient(135deg, #1a472a 0%, #2d6a4f 100%)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      flexWrap: 'wrap',
    }}>
      <span style={{ color: '#fff', fontSize: '22px', fontWeight: 'bold', letterSpacing: '1px', marginRight: 'auto' }}>
        🕌 Umrah Planner
      </span>

      {links.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          style={({ isActive }) => ({
            padding: '8px 18px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '14px',
            color: isActive ? '#1a472a' : '#fff',
            background: isActive ? '#fff' : 'rgba(255,255,255,0.12)',
            transition: 'all 0.2s',
          })}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
};

export default Navbar;
