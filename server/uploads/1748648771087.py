class Solution:
    def threeSum(self, nums: list[int]) -> list[list[int]]:
        res = []
        nums.sort() 

        for i,a in enumerate(nums):
            if i > 0 and a == nums[i-1]:
                continue
            l,r = i+1, len(nums)-1
            while l < r:
                a = a 
                b = nums[l]
                c = nums[r]
                threeSum = a + nums[l] + nums[r]
                if threeSum > 0:
                    r -= 1
                elif threeSum < 0:
                    l += 1 
                else:
                    res.append([a,nums[l],nums[r]])
                    l += 1
                    while nums[l] == nums[l-1] and l < r:
                        l += 1
        return res
pos = Solution()
print(pos.threeSum([-2,0,0,2,2,2]))