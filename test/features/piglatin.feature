# SPDX-Copyright: Copyright (c) Capital One Services, LLC 
# SPDX-License-Identifier: Apache-2.0 
# Copyright [2018] Capital One Services, LLC 

# Licensed under the Apache License, Version 2.0 (the "License"); 
# you may not use this file except in compliance with the License. 
# You may obtain a copy of the License at 

#   http://www.apache.org/licenses/LICENSE-2.0 

# Unless required by applicable law or agreed to in writing, software 
# distributed under the License is distributed on an "AS IS" BASIS, 
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or 
# implied. See the License for the specific language governing 
# permissions and limitations under the License.
@core
@greet
Feature: 
    As a speaker, I want to have messages translated to pig latin via a stream

    Scenario: I successfully translate several messages to pig latin with a stream
        Given I open a stream to PigLatin with id piglatin
        When I write { "message": "hello" } to stream piglatin
        And I write { "message": "goodbye" } to stream piglatin
        And I end the stream piglatin
        Then response message path $.count should be 2
        And response message path $.messages should be of type array with length 2
        And response message path $.messages[0] should be ellohay
        And response message path $.messages[1] should be oodbyegay

    Scenario: I successfully translate a file message to pig latin with a stream
        Given I open a stream to PigLatin with id piglatin
        When I pipe contents of file stream.json to stream piglatin
        And I end the stream piglatin
        Then response message path $.count should be 1
        And response message path $.messages should be of type array with length 1
        And response message path $.messages[0] should be Inway Ilefay

    Scenario: I successfully translate a table message to pig latin with a stream
        Given I open a stream to PigLatin with id piglatin
        When I write to stream piglatin with the data
            | name     | value      |
            | message  | In a table |
        And I end the stream piglatin
        Then response message path $.count should be 1
        And response message path $.messages should be of type array with length 1
        And response message path $.messages[0] should be Inway away abletay
