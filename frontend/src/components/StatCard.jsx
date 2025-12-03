import { FaArrowUp, FaArrowDown } from 'react-icons/fa'

const StatCard = ({ title, value, change, icon: Icon, color = 'blue' }) => {
  const colors = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500',
    orange: 'from-orange-500 to-red-500',
    yellow: 'from-yellow-500 to-amber-500'
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${colors[color]} bg-opacity-20`}>
          <Icon className="text-xl" />
        </div>
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
          change >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {change >= 0 ? <FaArrowUp /> : <FaArrowDown />}
          <span>{Math.abs(change)}%</span>
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
      <p className="text-text-secondary text-sm">{title}</p>
      
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center text-xs text-text-secondary">
          <span>Vs. mes anterior</span>
        </div>
      </div>
    </div>
  )
}

export default StatCard