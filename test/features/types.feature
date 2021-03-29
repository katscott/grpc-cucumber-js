@core
@greet
Feature:
    As a tester I want to be able to expect types

    @mine
    Scenario: I successfully check all types
        Given I set request message to {}
        When I request CheckTypes
        Then response status should be OK
        And response message path $.number should be of type number
        And response message path $.string should be of type string
        And response message path $.boolean should be of type boolean
        And response message path $.array should be of type array
        And response message path $.array should be of type array with length 2


