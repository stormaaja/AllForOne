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

set :bind, '127.0.1.2'
set :port, 1233
set :environment, :development

post '/send/:destination' do |destinationNick|
	puts "Object #{params["object"]} To: #{destinationNick}";
	result = { :result_code => 0 }
	result.to_json
end

get '/state/:user_id' do |userId|
	puts "State of #{userId}"
	result = { :operation => "transfer", :resources => { :wood => 99, :gold => 98, :food => 97, :diamonds => 96 } }
	result.to_json
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