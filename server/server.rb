#
# All for One (c) by FGJ15 JKL Team for All for One
# 
# All for One is licensed under a
# Creative Commons Attribution-ShareAlike 3.0 Unported License.
# 
# You should have received a copy of the license along with this
# work.  If not, see <http://creativecommons.org/licenses/by-sa/3.0/>.
# 
#

require 'sinatra'
require 'json'

set :bind, '127.0.1.2'
set :port, 1233
set :environment, :development

post '/transfer' do
	puts "From #{params["from"]} To: #{params["to"]}";
	result = { :result_code => 0 }
	result.to_json
end

get '/state/:user_id' do |userId|
	puts "State of #{userId}"
	result = { :result_code => 0 }
	result.to_json
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