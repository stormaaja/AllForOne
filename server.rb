#
# All for One (c) by FGJ15 JKL Team for All for One
# 
# All for One is licensed under a
# Creative Commons Attribution-ShareAlike 3.0 Unported License.
# 
# You should have received a copy of the license along with this
# work.  If not, see <http://creativecommons.org/licenses/by-sa/3.0/>.
# 
# This Server Backend application is not secured or user inputs aren't
# sanitized in any way. Use it only in your own risk and in controlled
# environment.
#

require 'sinatra'
require 'json'

set :bind, '10.240.200.61'
set :port, 1233
set :environment, :development

playerData = Hash.new
players = []

def getPlayer(players, nick)
	i = 0
	players.each do | player |
		if player[:nick] == nick
			return player
		end
	end
	nil
end

post '/send/:destination' do |destinationNick|
	puts "Object #{params["object"]} To: #{destinationNick}";
	if playerData[destinationNick].nil?
		playerData[destinationNick] = []
	end
	playerData[destinationNick].push(JSON.parse(params["object"]))
	""
end

post '/connect' do
	player = getPlayer(players, params["nick"])
	if player != nil
		puts "User #{params["nick"]} comes back";
		player["playertype"] = params["playertype"]
		playerData[params["nick"]].push({ :operation => "playerlist", :players =>  players })
	else
		puts "New user #{params["nick"]} as #{params["playertype"]}"
		players.push({ :nick => params["nick"], :playertype => params["playertype"] })
		playerData.each do |nick, data|
			playerData[nick].push({ :operation => "playerlist", :players =>  players })
		end
	end
	""
end

get '/state/:user_id' do |userId|
	result = [  ]
	if playerData[userId].nil?
		playerData[userId] = [
			{ :operation => "playerlist", :players => 
				players
			}
		]
	end
	result = playerData[userId].to_json
	playerData[userId] = []
	result
end

get '/' do
  File.read(File.join('public', 'index.html'))
end

# Others

get '*' do
	""
end

post '*' do
	""
end

put '*' do
	""
end

delete '*' do
	""
end